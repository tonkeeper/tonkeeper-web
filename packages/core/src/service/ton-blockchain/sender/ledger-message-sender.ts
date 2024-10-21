import { APIConfig } from '../../../entries/apis';
import { BlockchainApi, EmulationApi } from '../../../tonApiV2';
import BigNumber from 'bignumber.js';
import { LedgerSigner } from '../../../entries/signer';
import { walletContractFromState } from '../../wallet/contractService';
import { Address, Cell, comment as encodeComment } from '@ton/core';
import {
    externalMessage,
    getIsBlockchainAccountBounceable,
    getServerTime,
    getTonkeeperQueryId,
    getTTL,
    getWalletSeqNo,
    seeIfAddressBounceable,
    SendMode,
    toStateInit
} from '../../transfer/common';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TonAsset, tonAssetAddressToString } from '../../../entries/crypto/asset/ton-asset';
import { getJettonCustomPayload } from '../../transfer/jettonPayloadService';
import { TonWalletStandard } from '../../../entries/wallet';
import { JettonEncoder } from '../encoder/jetton-encoder';
import { NFTEncoder } from '../encoder/nft-encoder';
import { TonConnectTransactionPayload } from '../../../entries/tonConnect';
import { LedgerError } from '../../../errors/LedgerError';
import { MessagePayloadParam, serializePayload } from '../encoder/types';
import { TonPayloadFormat } from '@ton-community/ton-ledger/dist/TonTransport';

export class LedgerMessageSender {
    constructor(
        private readonly api: APIConfig,
        private readonly wallet: TonWalletStandard,
        private readonly signer: LedgerSigner
    ) {}

    blindSignSender() {
        /*const signer = (cell: Cell) => {
            await this.signer({
                to: Address.parse(transaction.to),
                bounce: true,
                amount: BigInt(value),
                seqno: wallet.seqno,
                timeout: getTTL(wallet.timestamp),
                sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
                stateInit: transaction.init || undefined,
                payload: transaction.body
                    ? {
                          type: 'unsafe',
                          message:
                              typeof transaction.body == 'string'
                                  ? Cell.fromBase64(transaction.body)
                                  : transaction.body
                      }
                    : undefined
            });
        };

        return new WalletMessageSender(this.api, this.wallet);*/
    }

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

        const transfer = await this.signer({
            to: Address.parse(to),
            bounce: await getIsBlockchainAccountBounceable(this.api, to),
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
            send: () =>
                new BlockchainApi(this.api.tonApiV2).sendBlockchainMessage({
                    sendBlockchainMessageRequest: { boc: external.toBoc().toString('base64') }
                }),
            estimate: () =>
                new EmulationApi(this.api.tonApiV2).emulateMessageToWallet({
                    emulateMessageToWalletRequest: { boc: external.toBoc().toString('base64') }
                })
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

        const { customPayload, stateInit, jettonWalletAddress } = await getJettonCustomPayload(
            this.api,
            this.wallet.rawAddress,
            tonAssetAddressToString(amount.asset.address)
        );

        const transfer = await this.signer({
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

        const transfer = await this.signer({
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
        if (transfer.messages.length !== 1) {
            throw new LedgerError('Ledger signer does not support multiple messages');
        }

        const { timestamp, seqno, contract } = await this.getTransferParameters();
        const message = transfer.messages[0];

        let transferCell: Cell;
        try {
            transferCell = await this.signer({
                to: Address.parse(message.address),
                bounce: seeIfAddressBounceable(message.address),
                amount: BigInt(message.amount),
                seqno,
                timeout: getTTL(timestamp),
                sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
                payload: message.payload
                    ? {
                          type: 'unsafe',
                          message: Cell.fromBase64(message.payload)
                      }
                    : undefined,
                stateInit: toStateInit(message.stateInit)
            });
        } catch (e) {
            console.error(e);
            throw new LedgerError(
                typeof e === 'string'
                    ? e
                    : typeof e === 'object' && e && 'message' in e
                    ? (e.message as string)
                    : 'Unknown error'
            );
        }

        return this.toSenderObject(externalMessage(contract, seqno, transferCell));
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
