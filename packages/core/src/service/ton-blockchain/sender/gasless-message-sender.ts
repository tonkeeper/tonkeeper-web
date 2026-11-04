import { APIConfig } from '../../../entries/apis';
import { walletContractFromState } from '../../wallet/contractService';
import {
    externalMessage,
    getServerTime,
    getTonkeeperQueryId,
    getTTL,
    getWalletSeqNo
} from '../utils';
import { CellSigner } from '../../../entries/signer';
import { WalletOutgoingMessage } from '../encoder/types';
import { TonWalletStandard } from '../../../entries/wallet';
import {
    Address,
    beginCell,
    internal,
    MessageRelaxed,
    SendMode,
    storeMessageRelaxed,
    toNano
} from '@ton/core';
import { WalletContractV5R1 } from '@ton/ton/dist/wallets/WalletContractV5R1';
import { ISender } from './ISender';
import { JettonEncoder } from '../encoder/jetton-encoder';
import { AccountEvent, GaslessApi } from '../../../tonApiV2';
import { TonAsset, tonAssetAddressToString } from '../../../entries/crypto/asset/ton-asset';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TonEstimation } from '../../../entries/send';

const GASLESS_OP_CODE = 0x878da6e3;

const commissionTransferAmount = toNano(0.1);

export class GaslessMessageSender implements ISender {
    private readonly gaslessApi: GaslessApi;

    constructor(
        private readonly gaslessConfig: {
            payWithAsset: TonAsset;
            relayerAddress: string;
        },
        private readonly api: APIConfig,
        private readonly wallet: TonWalletStandard,
        private readonly signer: CellSigner,
        private readonly confirmedCommission?: bigint
    ) {
        this.gaslessApi = new GaslessApi(this.api.tonApiV2);
    }

    public get excessAddress() {
        return this.gaslessConfig.relayerAddress;
    }

    /**
     * Binds the sender to the commission the user saw. Without it `send` refuses to sign, so a relayer
     * cannot raise the fee between the confirm screen and the signature.
     */
    public withConfirmedCommission(estimation: TonEstimation) {
        const { fee } = estimation;
        if (
            fee.type !== 'ton-asset' ||
            fee.extra.asset.id !== this.gaslessConfig.payWithAsset.id ||
            !fee.extra.weiAmount.isInteger() ||
            fee.extra.weiAmount.isNegative()
        ) {
            throw new Error('Estimation does not carry a gasless commission');
        }

        return new GaslessMessageSender(
            this.gaslessConfig,
            this.api,
            this.wallet,
            this.signer,
            BigInt(fee.extra.weiAmount.toFixed(0))
        );
    }

    /**
     * Signs only messages built on the device: the caller's outgoing set plus a commission transfer to
     * the configured relayer, for the amount bound by `withConfirmedCommission`. Nothing from the
     * relayer's response reaches the signature.
     */
    public async send(outgoing: WalletOutgoingMessage) {
        if (this.confirmedCommission === undefined) {
            throw new Error('Gasless commission is not confirmed');
        }
        this.assertSupported(outgoing);

        const commission = await this.encodeCommissionTransfer(this.confirmedCommission);

        const external = await this.toExternal({
            messages: [...outgoing.messages, commission],
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS
        });

        await this.gaslessApi.gaslessSend({
            gaslessSendRequest: {
                walletPublicKey: this.wallet.publicKey,
                boc: external.toBoc().toString('base64')
            }
        });

        return external;
    }

    public async estimate(outgoing: WalletOutgoingMessage) {
        const params = await this.getGaslessParams(outgoing);

        return {
            fee: {
                type: 'ton-asset' as const,
                extra: new AssetAmount({
                    asset: this.gaslessConfig.payWithAsset,
                    weiAmount: params.commission
                })
            },
            event: this.hideGaslessFeeCallFromEstimation(params.emulation)?.event
        };
    }

    private async toExternal({ messages, sendMode }: WalletOutgoingMessage) {
        const timestamp = await getServerTime(this.api);
        const seqno = await getWalletSeqNo(this.api, this.wallet.rawAddress);

        const contract = walletContractFromState(this.wallet) as WalletContractV5R1;
        const transfer = await contract.createTransfer({
            authType: 'internal',
            seqno,
            signer: this.signer,
            timeout: getTTL(timestamp),
            sendMode,
            messages
        });
        return externalMessage(contract, seqno, transfer);
    }

    private async encodeCommissionTransfer(jettonAmount: bigint): Promise<MessageRelaxed> {
        const { customPayload, stateInit, jettonWalletAddress } = await new JettonEncoder(
            this.api,
            this.wallet.rawAddress
        ).jettonCustomPayload(tonAssetAddressToString(this.gaslessConfig.payWithAsset.address));

        const relayer = Address.parse(this.gaslessConfig.relayerAddress);

        return internal({
            to: Address.parse(jettonWalletAddress),
            bounce: true,
            value: commissionTransferAmount,
            body: JettonEncoder.encodeTransferBody({
                queryId: getTonkeeperQueryId(),
                jettonAmount,
                toAddress: relayer,
                responseAddress: relayer,
                forwardAmount: JettonEncoder.jettonTransferForwardAmount,
                forwardPayload: beginCell().storeUint(GASLESS_OP_CODE, 32).endCell(),
                customPayload
            }),
            init: stateInit
        });
    }

    private assertSupported(outgoing: WalletOutgoingMessage) {
        if (outgoing.messages.length !== 1) {
            throw new Error('Can only send one message at once using gasless');
        }

        if (outgoing.sendMode > SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS) {
            throw new Error(`Unsupported send mode for gasless: ${outgoing.sendMode}`);
        }
    }

    private async getGaslessParams(outgoing: WalletOutgoingMessage) {
        this.assertSupported(outgoing);

        const messageToEstimate = beginCell()
            .storeWritable(storeMessageRelaxed(outgoing.messages[0]))
            .endCell();

        return this.gaslessApi.gaslessEstimate({
            masterId: tonAssetAddressToString(this.gaslessConfig.payWithAsset.address),
            gaslessEstimateRequest: {
                walletAddress: this.wallet.rawAddress,
                walletPublicKey: this.wallet.publicKey,
                messages: [
                    {
                        boc: messageToEstimate.toBoc().toString('hex')
                    }
                ],
                returnEmulation: true,
                throwErrorIfNotEnoughJettons: true
            },
            acceptLanguage: 'en'
        });
    }

    private hideGaslessFeeCallFromEstimation(estimation: { event: AccountEvent } | undefined) {
        if (!estimation) {
            return undefined;
        }

        const actions = estimation.event.actions;

        if (actions.length >= 2) {
            const action = actions[0];
            if (
                action.type === 'JettonTransfer' &&
                'jettonTransfer' in action &&
                action.jettonTransfer
            ) {
                const eventInfo = action.jettonTransfer as {
                    recipient: {
                        name: string;
                    };
                };
                if (eventInfo.recipient.name.toLowerCase() === 'tonkeeper battery') {
                    actions.shift();
                }
            }
        }

        return { ...estimation, event: { ...estimation.event, actions } };
    }
}
