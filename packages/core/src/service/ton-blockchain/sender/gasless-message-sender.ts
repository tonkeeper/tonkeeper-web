import { APIConfig } from '../../../entries/apis';
import { walletContractFromState } from '../../wallet/contractService';
import { externalMessage, getServerTime, getTonkeeperQueryId, getWalletSeqNo } from '../utils';
import { CellSigner } from '../../../entries/signer';
import { WalletOutgoingMessage } from '../encoder/types';
import { TonWalletStandard } from '../../../entries/wallet';
import { Address, beginCell, internal, MessageRelaxed, SendMode, toNano } from '@ton/core';
import { WalletContractV5R1 } from '@ton/ton/dist/wallets/WalletContractV5R1';
import { ISender } from './ISender';
import { JettonEncoder } from '../encoder/jetton-encoder';
import { AccountEvent } from '../../../tonApiV2';
import { Configuration, DefaultApi, EmulationApi } from '../../../batteryApi';
import { TonAsset, tonAssetAddressToString } from '../../../entries/crypto/asset/ton-asset';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TonEstimation } from '../../../entries/send';

const GASLESS_OP_CODE = 0x878da6e3;

const commissionTransferAmount = toNano(0.1);

/** The battery prices the message set it is shown; the fee transfer in it must not be empty. */
const estimationCommission = 1n;

/**
 * Pays the network fee of a jetton transfer in the jetton itself through the Battery relayer, as the
 * native apps do. Every signed message is built on the device: the caller's outgoing set plus a
 * commission transfer to the Battery excess account. The Battery only prices that exact set.
 */
export class GaslessMessageSender implements ISender {
    constructor(
        private readonly config: {
            payWithAsset: TonAsset;
            excessAddress: string;
            messageTtl: number;
            authToken: string;
        },
        private readonly api: {
            tonApi: APIConfig;
            batteryApi: Configuration;
        },
        private readonly wallet: TonWalletStandard,
        private readonly signer: CellSigner,
        private readonly confirmedCommission?: bigint
    ) {}

    public get excessAddress() {
        return this.config.excessAddress;
    }

    /**
     * Binds the sender to the commission the user saw. Without it `send` refuses to sign, so the
     * relayer cannot raise the fee between the confirm screen and the signature.
     */
    public withConfirmedCommission(estimation: TonEstimation) {
        const { fee } = estimation;
        if (
            fee.type !== 'ton-asset' ||
            fee.extra.asset.id !== this.config.payWithAsset.id ||
            !fee.extra.weiAmount.isInteger() ||
            fee.extra.weiAmount.isNegative()
        ) {
            throw new Error('Estimation does not carry a gasless commission');
        }

        return new GaslessMessageSender(
            this.config,
            this.api,
            this.wallet,
            this.signer,
            BigInt(fee.extra.weiAmount.toFixed(0))
        );
    }

    public async send(outgoing: WalletOutgoingMessage) {
        if (this.confirmedCommission === undefined) {
            throw new Error('Gasless commission is not confirmed');
        }

        const external = await this.toExternal(outgoing, this.confirmedCommission);

        await new DefaultApi(this.api.batteryApi).sendMessage({
            xTonConnectAuth: this.config.authToken,
            sendMessageRequest: { boc: external.toBoc().toString('base64') }
        });

        return external;
    }

    public async estimate(outgoing: WalletOutgoingMessage): Promise<TonEstimation> {
        const priced = await this.toExternal(outgoing, estimationCommission);
        const { commission } = await new DefaultApi(this.api.batteryApi).estimateGaslessCost({
            jettonMaster: tonAssetAddressToString(this.config.payWithAsset.address),
            estimateGaslessCostRequest: {
                payload: priced.toBoc().toString('base64'),
                battery: false
            },
            xTonConnectAuth: this.config.authToken
        });

        return {
            fee: {
                type: 'ton-asset',
                extra: new AssetAmount({ asset: this.config.payWithAsset, weiAmount: commission })
            },
            event: await this.emulate(outgoing, BigInt(commission))
        };
    }

    /** What the transfer does, for the confirm screen; the fee is shown apart, so its transfer is hidden. */
    private async emulate(
        outgoing: WalletOutgoingMessage,
        commission: bigint
    ): Promise<AccountEvent | undefined> {
        try {
            const external = await this.toExternal(outgoing, commission);
            const response = await new EmulationApi(this.api.batteryApi).emulateMessageToWallet({
                xTonConnectAuth: this.config.authToken,
                emulateMessageToWalletRequest: { boc: external.toBoc().toString('base64') }
            });
            // The Battery serves the tonapi event schema, as `BatteryMessageSender` relies on.
            const event = response.event as unknown as AccountEvent;
            const excess = Address.parse(this.config.excessAddress);
            return {
                ...event,
                actions: event.actions.filter(
                    action =>
                        !(
                            action.type === 'JettonTransfer' &&
                            action.jettonTransfer?.recipient &&
                            Address.parse(action.jettonTransfer.recipient.address).equals(excess)
                        )
                )
            };
        } catch {
            return undefined;
        }
    }

    private async toExternal(outgoing: WalletOutgoingMessage, commission: bigint) {
        this.assertSupported(outgoing);

        const timestamp = await getServerTime(this.api.tonApi);
        const seqno = await getWalletSeqNo(this.api.tonApi, this.wallet.rawAddress);

        const contract = walletContractFromState(this.wallet) as WalletContractV5R1;
        const transfer = await contract.createTransfer({
            authType: 'internal',
            seqno,
            signer: this.signer,
            timeout: timestamp + this.config.messageTtl,
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
            messages: [...outgoing.messages, await this.encodeCommissionTransfer(commission)]
        });
        return externalMessage(contract, seqno, transfer);
    }

    private async encodeCommissionTransfer(jettonAmount: bigint): Promise<MessageRelaxed> {
        const { customPayload, stateInit, jettonWalletAddress } = await new JettonEncoder(
            this.api.tonApi,
            this.wallet.rawAddress
        ).jettonCustomPayload(tonAssetAddressToString(this.config.payWithAsset.address));

        const excess = Address.parse(this.config.excessAddress);

        return internal({
            to: Address.parse(jettonWalletAddress),
            bounce: true,
            value: commissionTransferAmount,
            body: JettonEncoder.encodeTransferBody({
                queryId: getTonkeeperQueryId(),
                jettonAmount,
                toAddress: excess,
                responseAddress: excess,
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
}
