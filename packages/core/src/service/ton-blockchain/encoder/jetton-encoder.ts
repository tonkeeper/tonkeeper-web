import { Address, beginCell, Cell, toNano, internal } from '@ton/core';
import { getTonkeeperQueryId, SendMode } from '../../transfer/common';
import { APIConfig } from '../../../entries/apis';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TonAsset, tonAssetAddressToString } from '../../../entries/crypto/asset/ton-asset';
import { getJettonCustomPayload } from '../../transfer/jettonPayloadService';
import { MessagePayloadParam, serializePayload, WalletOutgoingMessage } from './types';

export class JettonEncoder {
    static jettonTransferAmount = toNano(0.1);

    static jettonTransferForwardAmount = BigInt(1);

    static encodeTransferBody = (params: {
        queryId: bigint;
        jettonAmount: bigint;
        toAddress: Address;
        responseAddress: Address;
        forwardAmount: bigint;
        forwardPayload: Cell | null;
        customPayload: Cell | null;
    }) => {
        return beginCell()
            .storeUint(0xf8a7ea5, 32) // request_transfer op
            .storeUint(params.queryId, 64)
            .storeCoins(params.jettonAmount)
            .storeAddress(params.toAddress)
            .storeAddress(params.responseAddress)
            .storeMaybeRef(params.customPayload) // null custom_payload
            .storeCoins(params.forwardAmount)
            .storeMaybeRef(params.forwardPayload) // storeMaybeRef put 1 bit before cell (forward_payload in cell) or 0 for null (forward_payload in slice)
            .endCell();
    };

    constructor(private readonly api: APIConfig, private readonly walletAddress: string) {}

    encodeTransfer = async (
        transfer:
            | {
                  to: string;
                  amount: AssetAmount<TonAsset>;
                  payload?: MessagePayloadParam;
                  responseAddress?: string;
              }
            | {
                  to: string;
                  amount: AssetAmount<TonAsset>;
                  payload?: MessagePayloadParam;
                  responseAddress?: string;
              }[]
    ): Promise<WalletOutgoingMessage> => {
        if (Array.isArray(transfer)) {
            return this.encodeMultiTransfer(transfer);
        } else {
            return this.encodeSingleTransfer(transfer);
        }
    };

    private encodeSingleTransfer = async ({
        to,
        amount,
        payload,
        responseAddress
    }: {
        to: string;
        amount: AssetAmount<TonAsset>;
        payload?: MessagePayloadParam;
        responseAddress?: string;
    }): Promise<WalletOutgoingMessage> => {
        const { customPayload, stateInit, jettonWalletAddress } = await getJettonCustomPayload(
            this.api,
            this.walletAddress,
            tonAssetAddressToString(amount.asset.address)
        );

        const jettonAmount = BigInt(amount.stringWeiAmount);

        const body = JettonEncoder.encodeTransferBody({
            queryId: getTonkeeperQueryId(),
            jettonAmount,
            toAddress: Address.parse(to),
            responseAddress: responseAddress
                ? Address.parse(responseAddress)
                : Address.parse(this.walletAddress),
            forwardAmount: JettonEncoder.jettonTransferForwardAmount,
            forwardPayload: serializePayload(payload) ?? null,
            customPayload
        });

        const message = internal({
            to: Address.parse(jettonWalletAddress),
            bounce: true,
            value: JettonEncoder.jettonTransferAmount,
            body: body,
            init: stateInit
        });

        return {
            messages: [message],
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS
        };
    };

    private encodeMultiTransfer = async (
        transfers: {
            to: string;
            amount: AssetAmount<TonAsset>;
            payload?: MessagePayloadParam;
            responseAddress?: string;
        }[]
    ): Promise<WalletOutgoingMessage> => {
        const { customPayload, stateInit, jettonWalletAddress } = await getJettonCustomPayload(
            this.api,
            this.walletAddress,
            (transfers[0].amount.asset.address as Address).toRawString()
        );

        if (customPayload || stateInit) {
            throw new Error('Multi transfer with custom payload is not supported');
        }

        const bodies = transfers.map(transfer =>
            JettonEncoder.encodeTransferBody({
                queryId: getTonkeeperQueryId(),
                jettonAmount: BigInt(transfer.amount.stringWeiAmount),
                toAddress: Address.parse(transfer.to),
                responseAddress: transfer.responseAddress
                    ? Address.parse(transfer.responseAddress)
                    : Address.parse(this.walletAddress),
                forwardAmount: JettonEncoder.jettonTransferForwardAmount,
                forwardPayload: serializePayload(transfer.payload) ?? null,
                customPayload: null
            })
        );

        return {
            messages: bodies.map(body =>
                internal({
                    to: Address.parse(jettonWalletAddress),
                    bounce: true,
                    value: JettonEncoder.jettonTransferAmount,
                    body: body
                })
            ),
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS
        };
    };
}
