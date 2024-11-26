import { APIConfig } from '../../../entries/apis';
import { walletContractFromState } from '../../wallet/contractService';
import { externalMessage, getServerTime, getTTL, getWalletSeqNo } from '../utils';
import { CellSigner } from '../../../entries/signer';
import { WalletOutgoingMessage } from '../encoder/types';
import { EmulationApi } from '../../../tonApiV2';
import { isW5Version, TonWalletStandard } from '../../../entries/wallet';
import { Builder, WalletContractV5R1 } from '@ton/ton';
import { ISender } from './ISender';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TON_ASSET } from '../../../entries/crypto/asset/constants';
import { Configuration as TwoFaConfiguration, MessageApi } from '../../../2faApi';
import { Address, beginCell, Cell, internal, SendMode, storeMessageRelaxed } from '@ton/core';
import { HexStringPrefixed } from '../../../utils/types';
import { TwoFAEncoder } from '../encoder/2fa-encoder';

export class TwoFAMessageSender implements ISender {
    constructor(
        private readonly api: {
            tonApi: APIConfig;
            twoFaApi: TwoFaConfiguration;
        },
        private readonly wallet: TonWalletStandard,
        private readonly signer: CellSigner,
        private readonly pluginConfig: {
            address: string;
            devicePublicKey: HexStringPrefixed;
        }
    ) {}

    public get excessAddress() {
        return this.wallet.rawAddress;
    }

    public async send(outgoing: WalletOutgoingMessage) {
        const params = await this.toPluginExternalParams(outgoing);

        const res = await new MessageApi(this.api.twoFaApi).sendMessage({
            sendMessageRequest: {
                boc: params.dataToSign.toBoc().toString('base64'), // TODO какая кодировка
                signature: params.signature.toString('base64'),
                devicePublicKey: this.pluginConfig.devicePublicKey
            }
        });

        return Cell.fromBase64(res.messageId); // TODO check
    }

    public async estimate(outgoing: WalletOutgoingMessage) {
        const external = await this.toDirectExternal(outgoing);

        const result = await new EmulationApi(this.api.tonApi.tonApiV2).emulateMessageToWallet({
            emulateMessageToWalletRequest: { boc: external.toBoc().toString('base64') }
        });

        return {
            extra: new AssetAmount({ asset: TON_ASSET, weiAmount: result.event.extra * -1 }),
            event: result.event
        };
    }

    private async toDirectExternal({ messages, sendMode }: WalletOutgoingMessage) {
        const timestamp = await getServerTime(this.api.tonApi);
        const seqno = await getWalletSeqNo(this.api.tonApi, this.wallet.rawAddress);

        const contract = walletContractFromState(this.wallet) as WalletContractV5R1;
        const transfer = await contract.createTransfer({
            seqno,
            signer: this.signer,
            timeout: getTTL(timestamp),
            sendMode,
            messages
        });
        return externalMessage(contract, seqno, transfer);
    }

    private async toPluginExternalParams({ messages, sendMode }: WalletOutgoingMessage) {
        if (!isW5Version(this.wallet.version)) {
            throw new Error('The wallet does not support plugins');
        }

        const timestamp = await getServerTime(this.api.tonApi);
        const timeout = getTTL(timestamp);
        const walletSeqno = await getWalletSeqNo(this.api.tonApi, this.wallet.rawAddress);

        const contract = walletContractFromState(this.wallet) as WalletContractV5R1;
        const transfer = contract.createTransfer({
            authType: 'extension',
            seqno: walletSeqno,
            timeout,
            sendMode,
            messages
        });

        const transferCell = this.transferBodyToCell(transfer);

        return this.encodeSendAction(transferCell);
    }

    private transferBodyToCell(transferBody: Cell) {
        return beginCell()
            .store(
                storeMessageRelaxed(
                    internal({
                        to: Address.parse(this.wallet.rawAddress),
                        value: BigInt(0),
                        bounce: false,
                        body: transferBody
                    })
                )
            )
            .endCell();
    }

    /**
     * send_actions#b15f2c8c msg:^Cell mode:uint8 = ExternalMessage;
     */
    private encodeSendAction(msgToTheWallet: Cell) {
        const opCode = 0xb15f2c8c;
        const payload = beginCell()
            .storeRef(msgToTheWallet)
            .storeUint(0, SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS);
        return this.encodeAndSignTwoFARequest(opCode, payload);
    }

    private async encodeAndSignTwoFARequest(opCode: number, payload: Builder) {
        const timestamp = await getServerTime(this.api.tonApi);
        const validUntil = getTTL(timestamp);

        const dataToSign = beginCell()
            .storeUint(opCode, 32) // op code of the method
            .storeUint(await this.getPluginSeqno(), 32)
            .storeUint(validUntil, 64)
            .storeBuilder(payload) // payload of the method
            .endCell();
        const signature = await this.signer(dataToSign);

        return {
            dataToSign,
            signature
        };
    }

    private async getPluginSeqno() {
        return new TwoFAEncoder(this.api.tonApi, this.wallet.rawAddress).getPluginSeqno(
            this.pluginConfig.address
        );
    }
}
