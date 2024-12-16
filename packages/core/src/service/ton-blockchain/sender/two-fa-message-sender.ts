import { APIConfig } from '../../../entries/apis';
import { walletContractFromState } from '../../wallet/contractService';
import { getServerTime, getTTL, getWalletSeqNo } from '../utils';
import { WalletOutgoingMessage } from '../encoder/types';
import { isW5Version, TonWalletStandard } from '../../../entries/wallet';
import { WalletContractV5R1 } from '@ton/ton';
import { ISender } from './ISender';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TON_ASSET } from '../../../entries/crypto/asset/constants';
import { Configuration as TwoFaConfiguration, MessageApi } from '../../../2faApi';
import { Address, beginCell, Cell, internal, storeMessageRelaxed, toNano } from '@ton/core';
import { TwoFAEncoder } from '../encoder/2fa-encoder';
import { BlockchainApi, EmulationApi } from '../../../tonApiV2';
import { CellSigner } from '../../../entries/signer';

let lastSearchingMessageId: string | undefined = undefined;

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
        }
    ) {}

    public get excessAddress() {
        return this.wallet.rawAddress;
    }

    public async send(outgoing: WalletOutgoingMessage) {
        const params = await this.toPluginExternalParams(outgoing);

        const res = await new MessageApi(this.api.twoFaApi).sendMessage({
            sendMessageRequest: {
                dataToSign: params.dataToSign.toBoc().toString('hex'),
                signature: params.signature.toString('hex'),
                extensionAddress: this.pluginConfig.address
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

    private async encodeSendAction(msgToTheWallet: Cell) {
        const dataToSign = await new TwoFAEncoder(
            this.api.tonApi,
            this.wallet.rawAddress
        ).encodeSendAction(this.pluginConfig.address, msgToTheWallet);

        const signature = await this.signer(dataToSign);

        return {
            dataToSign,
            signature
        };
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
            methodName: 'get_estimated_attached_value',
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
