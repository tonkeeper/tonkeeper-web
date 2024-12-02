import { APIConfig } from '../../../entries/apis';
import { walletContractFromState } from '../../wallet/contractService';
import { getServerTime, getTTL, getWalletSeqNo } from '../utils';
import { WalletOutgoingMessage } from '../encoder/types';
import { isW5Version, TonWalletStandard } from '../../../entries/wallet';
import { Builder, WalletContractV5R1 } from '@ton/ton';
import { ISender } from './ISender';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TON_ASSET } from '../../../entries/crypto/asset/constants';
import { Configuration as TwoFaConfiguration, MessageApi } from '../../../2faApi';
import {
    Address,
    beginCell,
    Cell,
    internal,
    SendMode,
    storeMessageRelaxed,
    toNano
} from '@ton/core';
import { TwoFAEncoder } from '../encoder/2fa-encoder';
import { HexStringPrefixed } from '../../../utils/types';
import nacl from 'tweetnacl';
import { BlockchainApi, EmulationApi } from '../../../tonApiV2';

export type TwoFADeviceKey = {
    publicKey: HexStringPrefixed;
    secretKey: HexStringPrefixed;
};

let lastSearchingMessageId: string | undefined = undefined;

export class TwoFAMessageSender implements ISender {
    constructor(
        private readonly api: {
            tonApi: APIConfig;
            twoFaApi: TwoFaConfiguration;
        },
        private readonly wallet: TonWalletStandard,
        private readonly pluginConfig: {
            address: string;
            deviceKey: TwoFADeviceKey;
        }
    ) {}

    public get excessAddress() {
        return this.wallet.rawAddress;
    }

    public async send(outgoing: WalletOutgoingMessage) {
        const params = await this.toPluginExternalParams(outgoing);

        const res = await new MessageApi(this.api.twoFaApi).sendMessage({
            sendMessageRequest: {
                address: this.pluginConfig.address,
                dataToSign: params.dataToSign.toBoc().toString('hex'),
                signature: params.signatureAndDeviceId.toBoc().toString('hex'),
                devicePublicKey: this.pluginConfig.deviceKey.publicKey.slice(2)
            }
        });

        lastSearchingMessageId = res.messageId;
        return Cell.fromBase64(await this.bocByMsgId(res.messageId));
    }

    public async estimate(outgoing: WalletOutgoingMessage) {
        const transferBody = await this.toTransferBody(outgoing);

        /**
         * Emulate internal message from the plugin to the wallet
         */

        const msgByValue = (value: bigint): Cell =>
            beginCell()
                .storeWritable(
                    storeMessageRelaxed({
                        info: {
                            type: 'internal',
                            src: Address.parse(this.pluginConfig.address),
                            dest: Address.parse(this.wallet.rawAddress),
                            value: { coins: value },
                            bounce: false,
                            ihrDisabled: true,
                            bounced: false,
                            ihrFee: 0n,
                            forwardFee: 0n,
                            createdAt: 0,
                            createdLt: 0n
                        },
                        body: transferBody
                    })
                )
                .endCell();

        const incomingMsgMock = msgByValue(toNano(0.1));

        const realValue = await this.estimatePluginOwnFee({
            forwardMsg: incomingMsgMock,
            actionsNumber: outgoing.messages.length
        });

        const int = msgByValue(realValue);

        const result = await new EmulationApi(
            this.api.tonApi.tonApiV2
        ).emulateMessageToAccountEvent({
            accountId: this.wallet.rawAddress,
            gaslessEstimateRequestMessagesInner: { boc: int.toBoc().toString('base64') }
        });

        return {
            extra: new AssetAmount({ asset: TON_ASSET, weiAmount: result.extra * -1 }),
            event: result
        };
    }

    private async toPluginExternalParams({ messages, sendMode }: WalletOutgoingMessage) {
        const transferBody = await this.toTransferBody({ messages, sendMode });
        const transferCell = await this.transferBodyToCell(transferBody, messages.length);

        return this.encodeSendAction(transferCell);
    }

    private async toTransferBody({ messages, sendMode }: WalletOutgoingMessage) {
        if (!isW5Version(this.wallet.version)) {
            throw new Error('The wallet does not support plugins');
        }

        const timestamp = await getServerTime(this.api.tonApi);
        const timeout = getTTL(timestamp);
        const walletSeqno = await getWalletSeqNo(this.api.tonApi, this.wallet.rawAddress);

        const contract = walletContractFromState(this.wallet) as WalletContractV5R1;
        return contract.createTransfer({
            authType: 'extension',
            seqno: walletSeqno,
            timeout,
            sendMode,
            messages
        });
    }

    private async transferBodyToCell(transferBody: Cell, actionsNumber: number) {
        const cellByValue = (value: bigint) =>
            beginCell()
                .store(
                    storeMessageRelaxed(
                        internal({
                            to: Address.parse(this.wallet.rawAddress),
                            value,
                            bounce: false,
                            body: transferBody
                        })
                    )
                )
                .endCell();

        const cell = cellByValue(BigInt(toNano(0.1)));

        const realValue = await this.estimatePluginOwnFee({ forwardMsg: cell, actionsNumber });

        return cellByValue(realValue);
    }

    /**
     * send_actions#b15f2c8c msg:^Cell mode:uint8 = ExternalMessage;
     */
    private encodeSendAction(msgToTheWallet: Cell) {
        const opCode = 0xb15f2c8c;
        const payload = beginCell()
            .storeRef(msgToTheWallet)
            .storeUint(SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS, 8);
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

        const signature = Buffer.from(
            nacl.sign.detached(
                dataToSign.hash(),
                Buffer.from(this.pluginConfig.deviceKey.secretKey.slice(2), 'hex')
            )
        );

        const signatureAndDeviceId = beginCell()
            .storeBuffer(signature)
            .storeUint(await this.getKeyId(), 32)
            .endCell();

        return {
            dataToSign,
            signatureAndDeviceId
        };
    }

    private async getPluginSeqno() {
        return new TwoFAEncoder(this.api.tonApi, this.wallet.rawAddress).getPluginSeqno(
            this.pluginConfig.address
        );
    }

    private async getKeyId() {
        const keysDict = await new TwoFAEncoder(
            this.api.tonApi,
            this.wallet.rawAddress
        ).getPluginDeviceKeysDict(this.pluginConfig.address);

        for (const pair of keysDict) {
            if (pair[1] === BigInt(this.pluginConfig.deviceKey.publicKey)) {
                return pair[0];
            }
        }

        throw new Error('Key not found');
    }

    private async estimatePluginOwnFee({
        forwardMsg,
        actionsNumber
    }: {
        forwardMsg: Cell;
        actionsNumber: number;
    }) {
        const res = await new BlockchainApi(
            this.api.tonApi.tonApiV2
        ).execGetMethodForBlockchainAccount({
            accountId: this.pluginConfig.address, // TODO не работает нормально
            methodName: 'get_gas_fee_for_processing_send_actions',
            args: [forwardMsg.toBoc().toString('base64'), '0x' + actionsNumber.toString(16), '0x0']
        });

        if (res.stack[0].num === undefined || !res.success) {
            throw new Error(`Unexpected result ${res.stack[0].type}`);
        }

        return BigInt(res.stack[0].num);
    }

    private async bocByMsgId(msgId: string, attempt = 0): Promise<string> {
        if (lastSearchingMessageId !== msgId) {
            throw new Error('Message has been replaced with a new one. Stop searching for it');
        }
        const maxAttempts = 200; // TODO взять из конфига
        const timeout = 1000;

        try {
            const result = await new MessageApi(this.api.twoFaApi).getMessageInfo({ id: msgId });
            if (!result.extMsg) {
                throw new Error('Message not found');
            }

            return result.extMsg;
        } catch (e) {
            console.error(e);

            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, timeout));
                return this.bocByMsgId(msgId, attempt + 1);
            } else {
                throw e;
            }
        }
    }
}
