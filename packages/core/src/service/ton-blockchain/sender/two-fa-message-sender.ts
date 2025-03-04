import { APIConfig } from '../../../entries/apis';
import { walletContractFromState, walletStateInitFromState } from '../../wallet/contractService';
import { getServerTime, getTTL, getWalletSeqNo } from '../utils';
import { WalletOutgoingMessage } from '../encoder/types';
import { isW5Version, TonWalletStandard } from '../../../entries/wallet';
import { WalletContractV5R1 } from '@ton/ton';
import { ISender } from './ISender';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TON_ASSET } from '../../../entries/crypto/asset/constants';
import {
    AuthApi,
    Configuration as TwoFaConfiguration,
    MessageApi,
    MessageState
} from '../../../2faApi';
import {
    Address,
    beginCell,
    Cell,
    external,
    internal,
    MessageRelaxed,
    storeMessage,
    storeMessageRelaxed,
    toNano
} from '@ton/core';
import { TwoFAEncoder } from '../encoder/two-fa-encoder';
import { AccountsApi, BlockchainApi, EmulationApi } from '../../../tonApiV2';
import { CellSigner } from '../../../entries/signer';

let lastSearchingMessageId: string | undefined = undefined;

type CloseConfirmModalCallback = () => void;

export class TwoFAMessageSender implements ISender {
    constructor(
        private readonly api: {
            tonApi: APIConfig;
            twoFaApi: TwoFaConfiguration;
        },
        private readonly wallet: TonWalletStandard,
        private readonly signer: CellSigner,
        private readonly pluginAddress: string,
        private readonly options: {
            openConfirmModal?: () => CloseConfirmModalCallback;
            confirmMessageTGTtlSeconds?: number;
        } = {}
    ) {}

    public get excessAddress() {
        return this.wallet.rawAddress;
    }

    public async send(outgoing: WalletOutgoingMessage) {
        const params = await this.toPluginExternalParams(outgoing);

        const res = await new MessageApi(this.api.twoFaApi).sendMessage({
            removeExtensionRequest: {
                dataToSign: params.dataToSign.toBoc().toString('hex'),
                signature: params.signature.toString('hex'),
                wallet: this.wallet.rawAddress, // TODO временно для Захара, поменять на кошелек
                stateInit: walletStateInitFromState(this.wallet)
            }
        });

        const closeConfirmModal = this.options.openConfirmModal?.();

        lastSearchingMessageId = res.messageId;
        try {
            return Cell.fromBase64(await this.bocByMsgId(res.messageId));
        } catch (e) {
            console.error(e);
            throw e;
        } finally {
            closeConfirmModal?.();
        }
    }

    public async estimate(outgoing: WalletOutgoingMessage) {
        const transferBody = await this.toTransferBody({
            sendMode: outgoing.sendMode,
            messages: await this.addRefillMessageIfNeeded(outgoing.messages)
        });

        /**
         * Emulate internal message from the plugin to the wallet
         */

        const msgByValue = (value: bigint): Cell =>
            beginCell()
                .storeWritable(
                    storeMessageRelaxed({
                        info: {
                            type: 'internal',
                            src: Address.parse(this.pluginAddress),
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

        if (
            result.actions[0].tonTransfer &&
            result.actions[0].tonTransfer.sender.address === this.pluginAddress
        ) {
            result.actions = result.actions.slice(1);
        }

        return {
            fee: {
                type: 'ton-asset' as const,
                extra: new AssetAmount({ asset: TON_ASSET, weiAmount: result.extra * -1 })
            },
            event: result
        };
    }

    public async sendRemoveExtension() {
        const timestamp = await getServerTime(this.api.tonApi);
        const validUntil = getTTL(timestamp);
        const seqno = await new TwoFAEncoder(
            this.api.tonApi,
            this.wallet.rawAddress
        ).getPluginSeqno(this.pluginAddress);

        const dataToSign = beginCell()
            .store(TwoFAEncoder.removeBody)
            .storeUint(seqno, 32)
            .storeUint(validUntil, 64)
            .endCell();

        const signature = await this.signer(dataToSign);

        const res = await new AuthApi(this.api.twoFaApi).removeExtension({
            removeExtensionRequest: {
                dataToSign: dataToSign.toBoc().toString('hex'),
                signature: signature.toString('hex'),
                wallet: this.wallet.rawAddress, // TODO временно для Захара, поменять на кошелек
                stateInit: walletStateInitFromState(this.wallet)
            }
        });

        const closeConfirmModal = this.options.openConfirmModal?.();

        lastSearchingMessageId = res.messageId;
        try {
            return Cell.fromBase64(await this.bocByMsgId(res.messageId));
        } catch (e) {
            console.error(e);
        } finally {
            closeConfirmModal?.();
        }
    }

    public async sendCancelRecovery() {
        const timestamp = await getServerTime(this.api.tonApi);
        const validUntil = getTTL(timestamp);
        const seqno = await new TwoFAEncoder(
            this.api.tonApi,
            this.wallet.rawAddress
        ).getPluginSeqno(this.pluginAddress);

        const dataToSign = beginCell()
            .store(TwoFAEncoder.cancelRecoveryBody)
            .storeUint(seqno, 32)
            .storeUint(validUntil, 64)
            .endCell();

        const signature = await this.signer(dataToSign);

        const body = beginCell()
            .storeBuffer(signature)
            .storeSlice(dataToSign.beginParse())
            .endCell();

        const ext = beginCell()
            .storeWritable(
                storeMessage(
                    external({
                        to: this.pluginAddress,
                        body
                    })
                )
            )
            .endCell();

        await new BlockchainApi(this.api.tonApi.tonApiV2).sendBlockchainMessage({
            sendBlockchainMessageRequest: { boc: ext.toBoc().toString('base64') }
        });
    }

    private async addRefillMessageIfNeeded(messages: MessageRelaxed[]): Promise<MessageRelaxed[]> {
        const pluginBalance = BigInt(
            (
                await new AccountsApi(this.api.tonApi.tonApiV2).getAccount({
                    accountId: this.pluginAddress
                })
            ).balance
        );

        if (pluginBalance > TwoFAEncoder.refillAtValue) {
            return messages;
        }

        const refillMessage = internal({
            to: this.pluginAddress,
            value: TwoFAEncoder.refillValue,
            bounce: false
        });

        return [...messages, refillMessage];
    }

    private async toPluginExternalParams({ messages, sendMode }: WalletOutgoingMessage) {
        const transferBody = await this.toTransferBody({
            sendMode,
            messages: await this.addRefillMessageIfNeeded(messages)
        });
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
        ).encodeSendAction(this.pluginAddress, msgToTheWallet);

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
            accountId: this.pluginAddress,
            methodName: 'get_estimated_attached_value',
            fixOrder: false,
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
        const timeoutMS = 1000;
        const confirmMessageTGTtlMS = (this.options.confirmMessageTGTtlSeconds ?? 600) * 1000;

        const maxAttempts = confirmMessageTGTtlMS / timeoutMS;

        if (attempt >= maxAttempts) {
            throw new Error('Message was not confirmed in timeout');
        }

        let result;
        try {
            result = await new MessageApi(this.api.twoFaApi).getMessageInfo({ id: msgId });
        } catch (e) {
            console.error(e);
        }

        if (result) {
            if (result.state === MessageState.Failed || result.state === MessageState.Canceled) {
                throw new Error('Message was not confirmed');
            }

            if (result.state === MessageState.Expired) {
                throw new Error('Message was not confirmed in timeout');
            }

            if (result.state === MessageState.Confirmed) {
                return result.extMsg!;
            }
        }

        await new Promise(resolve => setTimeout(resolve, timeoutMS));
        return this.bocByMsgId(msgId, attempt + 1);
    }
}
