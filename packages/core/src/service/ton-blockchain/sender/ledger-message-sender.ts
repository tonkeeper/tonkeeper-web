import { APIConfig } from '../../../entries/apis';
import { BlockchainApi, EmulationApi } from '../../../tonApiV2';
import BigNumber from 'bignumber.js';
import { LedgerSigner } from '../../../entries/signer';
import { walletContractFromState } from '../../wallet/contractService';
import { Address, Cell, comment as encodeComment, SendMode, StateInit } from '@ton/core';
import {
    externalMessage,
    userInputAddressIsBounceable,
    getServerTime,
    getTonkeeperQueryId,
    getTTL,
    getWalletSeqNo,
    tonConnectAddressIsBounceable,
    toStateInit,
    estimationSigner
} from '../utils';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TonAsset, tonAssetAddressToString } from '../../../entries/crypto/asset/ton-asset';
import { TonWalletStandard } from '../../../entries/wallet';
import { JettonEncoder } from '../encoder/jetton-encoder';
import { NFTEncoder } from '../encoder/nft-encoder';
import { TonConnectTransactionPayload } from '../../../entries/tonConnect';
import { LedgerError } from '../../../errors/LedgerError';
import { MessagePayloadParam, serializePayload, WalletOutgoingMessage } from '../encoder/types';
import { TonPayloadFormat } from '@ton-community/ton-ledger/dist/TonTransport';
import { TON_ASSET } from '../../../entries/crypto/asset/constants';
import { TonEstimation } from '../../../entries/send';
import { LedgerTransaction } from '../../ledger/connector';
import { WalletMessageSender } from './wallet-message-sender';
import { TonConnectEncoder } from '../encoder/ton-connect-encoder';
import { ISender } from './ISender';

export class LedgerMessageSender implements ISender {
    constructor(
        private readonly api: APIConfig,
        private readonly wallet: TonWalletStandard,
        private readonly signer: LedgerSigner
    ) {}

    public get excessAddress() {
        return this.wallet.rawAddress;
    }

    private async sign<T extends LedgerTransaction | LedgerTransaction[]>(
        tx: T
    ): Promise<T extends LedgerTransaction ? Cell : Cell[]> {
        if (Array.isArray(tx)) {
            return this.signer(tx) as Promise<T extends LedgerTransaction ? Cell : Cell[]>;
        } else {
            const res = await this.signer([tx]);
            return res[0] as T extends LedgerTransaction ? Cell : Cell[];
        }
    }

    private async toExternals(outgoing: WalletOutgoingMessage) {
        const { timestamp, seqno, contract } = await this.getTransferParameters();

        const transferCells = await this.sign(
            outgoing.messages.map((message, index) => {
                if (message.info.type !== 'internal') {
                    throw new Error('Only internal messages are supported by Ledger');
                }

                return {
                    to: message.info.dest,
                    bounce: message.info.bounce,
                    amount: message.info.value.coins,
                    seqno: seqno + index,
                    timeout: getTTL(timestamp + index * 60),
                    sendMode: outgoing.sendMode,
                    payload: message.body
                        ? {
                              type: 'unsafe' as const,
                              message: message.body
                          }
                        : undefined,
                    stateInit: message.init ?? undefined
                };
            })
        );

        return transferCells.map((cell, index) => externalMessage(contract, seqno + index, cell));
    }

    public async send(outgoing: WalletOutgoingMessage) {
        const externals = await this.toExternals(outgoing);

        await new BlockchainApi(this.api.tonApiV2).sendBlockchainMessage({
            sendBlockchainMessageRequest: {
                batch: externals.map(message => message.toBoc().toString('base64'))
            }
        });
        return externals[0];
    }

    public async estimate(outgoing: WalletOutgoingMessage) {
        return new WalletMessageSender(this.api, this.wallet, estimationSigner).estimate(outgoing);
    }

    tonRawTransfer = async ({
        to,
        value,
        body,
        bounce,
        sendMode,
        init
    }: {
        to: Address;
        value: bigint;
        body?: Cell;
        sendMode: SendMode;
        bounce: boolean;
        init?: StateInit;
    }) => {
        const { timestamp, seqno, contract } = await this.getTransferParameters();

        const transfer = await this.sign({
            to,
            bounce,
            amount: value,
            seqno,
            timeout: getTTL(timestamp),
            sendMode: sendMode,
            stateInit: init,
            payload: body
                ? {
                      type: 'unsafe',
                      message: body
                  }
                : undefined
        });

        return this.toSenderObject(externalMessage(contract, seqno, transfer));
    };

    tonTransfer = async ({
        to,
        weiAmount,
        payload,
        isMax
    }: {
        to: string;
        weiAmount: BigNumber;
        payload?: MessagePayloadParam;
        isMax?: boolean;
    }) => {
        const { timestamp, seqno, contract } = await this.getTransferParameters();

        const transfer = await this.sign({
            to: Address.parse(to),
            bounce: await userInputAddressIsBounceable(this.api, to),
            amount: BigInt(weiAmount.toFixed(0)),
            seqno,
            timeout: getTTL(timestamp),
            sendMode: isMax
                ? SendMode.CARRY_ALL_REMAINING_BALANCE + SendMode.IGNORE_ERRORS
                : SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
            payload: this.serializeLedgerMessagePayload(payload)
        });

        return this.toSenderObject(externalMessage(contract, seqno, transfer));
    };

    private toSenderObject(external: Cell) {
        return {
            send: async () => {
                await new BlockchainApi(this.api.tonApiV2).sendBlockchainMessage({
                    sendBlockchainMessageRequest: { boc: external.toBoc().toString('base64') }
                });
                return external;
            },
            estimate: async (): Promise<TonEstimation> => {
                const result = await new EmulationApi(this.api.tonApiV2).emulateMessageToWallet({
                    emulateMessageToWalletRequest: { boc: external.toBoc().toString('base64') }
                });

                return {
                    fee: {
                        type: 'ton-asset' as const,
                        extra: new AssetAmount({
                            asset: TON_ASSET,
                            weiAmount: result.event.extra * -1
                        })
                    },
                    event: result.event
                };
            }
        };
    }

    jettonTransfer = async ({
        amount,
        to,
        payload
    }: {
        to: string;
        amount: AssetAmount<TonAsset>;
        payload?: MessagePayloadParam;
    }) => {
        const { timestamp, seqno, contract } = await this.getTransferParameters();

        const jettonEncoder = new JettonEncoder(this.api, this.wallet.rawAddress);

        const { customPayload, stateInit, jettonWalletAddress } =
            await jettonEncoder.jettonCustomPayload(tonAssetAddressToString(amount.asset.address));

        const transfer = await this.sign({
            to: Address.parse(jettonWalletAddress),
            bounce: true,
            amount: JettonEncoder.jettonTransferAmount,
            seqno,
            timeout: getTTL(timestamp),
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
            payload: {
                knownJetton: null,
                type: 'jetton-transfer',
                queryId: getTonkeeperQueryId(),
                amount: BigInt(amount.stringWeiAmount),
                destination: Address.parse(to),
                responseDestination: Address.parse(this.wallet.rawAddress),
                forwardAmount: JettonEncoder.jettonTransferForwardAmount,
                forwardPayload: serializePayload(payload) ?? null,
                customPayload
            },
            stateInit
        });

        return this.toSenderObject(externalMessage(contract, seqno, transfer));
    };

    nftTransfer = async ({
        to,
        nftTransferAmount,
        nftAddress,
        comment
    }: {
        to: string;
        nftAddress: string;
        nftTransferAmount: bigint;
        comment?: string;
    }) => {
        const { timestamp, seqno, contract } = await this.getTransferParameters();

        const transfer = await this.sign({
            to: Address.parse(nftAddress),
            bounce: true,
            amount: nftTransferAmount,
            seqno,
            timeout: getTTL(timestamp),
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
            payload: {
                type: 'nft-transfer',
                queryId: getTonkeeperQueryId(),
                newOwner: Address.parse(to),
                responseDestination: Address.parse(this.wallet.rawAddress),
                forwardAmount: NFTEncoder.nftTransferForwardAmount,
                forwardPayload: comment ? encodeComment(comment) : null,
                customPayload: null
            }
        });

        return this.toSenderObject(externalMessage(contract, seqno, transfer));
    };

    tonConnectTransfer = async (transfer: TonConnectTransactionPayload) => {
        const { timestamp, seqno, contract } = await this.getTransferParameters();

        let transferCells: Cell[];
        try {
            transferCells = await this.sign(
                await Promise.all(
                    transfer.messages.map(async (message, index) => ({
                        to: Address.parse(message.address),
                        bounce: await tonConnectAddressIsBounceable(this.api, message.address),
                        amount: BigInt(message.amount),
                        seqno: seqno + index,
                        timeout: getTTL(timestamp + index * 60),
                        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
                        payload: message.payload
                            ? {
                                  type: 'unsafe' as const,
                                  message: Cell.fromBase64(message.payload)
                              }
                            : undefined,
                        stateInit: toStateInit(message.stateInit)
                    }))
                )
            );
        } catch (e) {
            console.error(e);
            if (typeof e === 'object' && e && 'name' in e && e.name === 'UserCancelledError') {
                throw e as Error;
            }
            throw new LedgerError(
                typeof e === 'string'
                    ? e
                    : typeof e === 'object' && e && 'message' in e
                    ? (e.message as string)
                    : 'Unknown error'
            );
        }

        const externalMessages = transferCells.map((cell, index) =>
            externalMessage(contract, seqno + index, cell)
        );

        return {
            send: async () => {
                await new BlockchainApi(this.api.tonApiV2).sendBlockchainMessage({
                    sendBlockchainMessageRequest: {
                        batch: externalMessages.map(message => message.toBoc().toString('base64'))
                    }
                });
                return externalMessages[0];
            },
            estimate: async (): Promise<TonEstimation> => {
                return new WalletMessageSender(this.api, this.wallet, estimationSigner).estimate(
                    await new TonConnectEncoder(this.api, this.wallet.rawAddress).encodeTransfer({
                        ...transfer,
                        variant: 'standard'
                    })
                );
            }
        };
    };

    private async getTransferParameters() {
        const timestamp = await getServerTime(this.api);
        const seqno = await getWalletSeqNo(this.api, this.wallet.rawAddress);
        const contract = walletContractFromState(this.wallet);
        return {
            timestamp,
            seqno,
            contract
        };
    }

    private serializeLedgerMessagePayload(
        payload?: MessagePayloadParam
    ): TonPayloadFormat | undefined {
        if (!payload) {
            return undefined;
        }

        if (payload.type === 'comment') {
            return { type: 'comment', text: payload.value };
        }

        return {
            type: 'unsafe',
            message: payload.value
        };
    }
}
