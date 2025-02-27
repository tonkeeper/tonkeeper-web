import { APIConfig } from '../../../entries/apis';
import { walletContractFromState } from '../../wallet/contractService';
import { externalMessage, getServerTime, getTTL, getWalletSeqNo, toStateInit } from '../utils';
import { CellSigner } from '../../../entries/signer';
import { WalletOutgoingMessage } from '../encoder/types';
import { TonWalletStandard } from '../../../entries/wallet';
import { SendMode, WalletContractV5R1 } from '@ton/ton';
import { ISender } from './ISender';
import { beginCell, Cell, internal, storeMessageRelaxed } from '@ton/core';
import { GaslessApi } from '../../../tonApiV2';
import { TonAsset, tonAssetAddressToString } from '../../../entries/crypto/asset/ton-asset';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';

export class GaslessMessageSender implements ISender {
    private readonly gaslessApi: GaslessApi;

    constructor(
        private readonly gaslessConfig: {
            payWithAsset: TonAsset;
            relayerAddress: string;
        },
        private readonly api: APIConfig,
        private readonly wallet: TonWalletStandard,
        private readonly signer: CellSigner
    ) {
        this.gaslessApi = new GaslessApi(this.api.tonApiV2);
    }

    public get excessAddress() {
        return this.gaslessConfig.relayerAddress;
    }

    public async send(outgoing: WalletOutgoingMessage) {
        const params = await this.getGaslessParams(outgoing);

        const external = await this.toExternal({
            messages: params.messages.map(message =>
                internal({
                    to: message.address,
                    value: BigInt(message.amount),
                    body: message.payload
                        ? Cell.fromBoc(Buffer.from(message.payload, 'hex'))[0]
                        : undefined,
                    init: toStateInit(message.stateInit)
                })
            ),
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
            }
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

    private async getGaslessParams(outgoing: WalletOutgoingMessage) {
        if (outgoing.messages.length !== 1) {
            throw new Error('Can only send one message at once using gasless');
        }

        if (outgoing.sendMode > SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS) {
            throw new Error(`Unsupported send mode for gasless: ${outgoing.sendMode}`);
        }

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
                ]
            }
        });
    }
}
