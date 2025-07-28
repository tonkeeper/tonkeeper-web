import { TronApi } from '../../../tronApi';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TronAsset } from '../../../entries/crypto/asset/tron-asset';
import { TronSigner } from '../../../entries/signer';
import { TronWallet } from '../../../entries/tron/tron-wallet';
import { TronEstimation } from '../../../entries/send';
import { errorMessage } from '../../../utils/types';
import { NotEnoughBatteryBalanceError } from '../../../errors/NotEnoughBatteryBalanceError';
import { ITronSender } from './I-tron-sender';
import {
    Configuration as BatteryConfiguration,
    DefaultApi as BatteryApi
} from '../../../batteryApi';
import { TronTrc20Encoder } from '../encoder/tron-trc20-encoder';
import { TON_ASSET } from '../../../entries/crypto/asset/constants';
import { WalletMessageSender } from '../../ton-blockchain/sender';
import { TonEncoder } from '../../ton-blockchain/encoder/ton-encoder';

export class TronTonSender implements ITronSender {
    private batteryApi: BatteryApi;

    private trc20Encoder: TronTrc20Encoder;

    constructor(
        private tronApi: TronApi,
        batteryConfig: BatteryConfiguration,
        private walletInfo: TronWallet,
        private tronSigner: TronSigner,
        private readonly xTonConnectAuth: string,
        private tonSender: WalletMessageSender
    ) {
        this.batteryApi = new BatteryApi(batteryConfig);
        this.trc20Encoder = new TronTrc20Encoder({
            walletAddress: this.walletInfo.address,
            tronGridBaseUrl: this.tronApi.tronGridBaseUrl
        });
    }

    async send(to: string, assetAmount: AssetAmount<TronAsset>, estimation: TronEstimation) {
        if (estimation.fee.type !== 'ton-asset-relayed') {
            throw new Error('Unacceptable fee type');
        }

        const signedTronTx = await this.tronSigner(
            await this.trc20Encoder.encodeTransferTransaction(to, assetAmount)
        );

        const tonTransfer = await new TonEncoder(this.tonSender.api).encodeTransfer({
            to: estimation.fee.sendToAddress,
            weiAmount: estimation.fee.extra.weiAmount
        });
        const signedTonTx = await this.tonSender.toExternal(tonTransfer);

        try {
            await this.batteryApi.tronSend({
                xTonConnectAuth: this.xTonConnectAuth,
                tronSendRequest: {
                    tx: Buffer.from(JSON.stringify(signedTronTx)).toString('base64'),
                    wallet: this.walletInfo.address,
                    energy: estimation.resources.energy,
                    bandwidth: estimation.resources.bandwidth,
                    instantFeeTx: signedTonTx.toBoc().toString('base64')
                }
            });
        } catch (e) {
            if (e && typeof e === 'object' && 'response' in e && e.response instanceof Response) {
                const message = await e.response.text();
                if (message.includes('Not enough balance')) {
                    throw new NotEnoughBatteryBalanceError(errorMessage(e)!);
                }
            }

            throw e;
        }
    }

    async estimate(to: string, assetAmount: AssetAmount<TronAsset>): Promise<TronEstimation> {
        const resources = await this.tronApi.applyResourcesSafetyMargin(
            await this.tronApi.estimateResources(
                await this.trc20Encoder.encodeTransferEstimateRequest(to, assetAmount)
            )
        );

        /* const bandwidhAvailable = await this.tronApi.getAccountBandwidth(this.walletInfo.address);
        resources.bandwidth = Math.max(0, resources.bandwidth - bandwidhAvailable);*/

        const estimation = await this.batteryApi.tronEstimate({
            wallet: this.walletInfo.address,
            ...resources
        });

        const tonInstantFee = estimation.instantFee.acceptedAssets.find(a => a.type === 'ton');
        if (!tonInstantFee) {
            throw new Error('Instant fee for ton not allowed');
        }

        return {
            fee: {
                type: 'ton-asset-relayed' as const,
                extra: new AssetAmount({ weiAmount: tonInstantFee.amountNano, asset: TON_ASSET }),
                sendToAddress: estimation.instantFee.feeAddress
            },
            resources
        };
    }
}
