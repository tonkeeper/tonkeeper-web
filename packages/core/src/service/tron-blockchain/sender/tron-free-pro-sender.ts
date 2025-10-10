import { TronApi, TronResources } from '../../../tronApi';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TronAsset } from '../../../entries/crypto/asset/tron-asset';
import { TronSigner } from '../../../entries/signer';
import { TronWallet } from '../../../entries/tron/tron-wallet';
import { TronEstimation } from '../../../entries/send';
import { errorMessage } from '../../../utils/types';
import { NotEnoughBatteryBalanceError } from '../../../errors/NotEnoughBatteryBalanceError';
import { BaseTronSender, ITronSender } from './I-tron-sender';
import {
    Configuration as BatteryConfiguration,
    DefaultApi as BatteryApi
} from '../../../batteryApi';
import { TronTrc20Encoder } from '../encoder/tron-trc20-encoder';
import { TransactionFeeFreeTransfer } from '../../../entries/crypto/transaction-fee';
import { TronNotEnoughBalanceEstimationError } from '../../../errors/TronNotEnoughBalanceEstimationError';

export class TronFreeProSender extends BaseTronSender implements ITronSender {
    private batteryApi: BatteryApi;

    protected trc20Encoder: TronTrc20Encoder;

    constructor(
        protected tronApi: TronApi,
        batteryConfig: BatteryConfiguration,
        protected tronWallet: TronWallet,
        private tronSigner: TronSigner,
        private readonly xBatteryAuth: string,
        private readonly xProAuthToken: string
    ) {
        super();
        this.batteryApi = new BatteryApi(batteryConfig);
        this.trc20Encoder = new TronTrc20Encoder({
            walletAddress: this.tronWallet.address,
            tronGridBaseUrl: this.tronApi.tronGridBaseUrl
        });
    }

    async send(to: string, assetAmount: AssetAmount<TronAsset>, estimation: TronEstimation) {
        const signedTx = await this.tronSigner(
            await this.trc20Encoder.encodeTransferTransaction(to, assetAmount)
        );

        await this.checkBandwidthIsEnough(estimation.resources.bandwidth, signedTx.raw_data_hex);

        try {
            await this.batteryApi.tronSend({
                xProAuth: this.xProAuthToken,
                xTonConnectAuth: this.xBatteryAuth,
                tronSendRequest: {
                    tx: Buffer.from(JSON.stringify(signedTx)).toString('base64'),
                    wallet: this.tronWallet.address,
                    energy: estimation.resources.energy,
                    bandwidth: estimation.resources.bandwidth
                }
            });
        } catch (e) {
            throw await this.formatBatteryError(e);
        }
    }

    async estimate(
        to: string,
        assetAmount: AssetAmount<TronAsset>
    ): Promise<{
        fee: TransactionFeeFreeTransfer;
        resources: TronResources;
    }> {
        const resources = await this.estimateTransferResources(to, assetAmount);

        const { availableTransfers } = await this.batteryApi.getTronAvailableTransfers({
            xProAuth: this.xProAuthToken
        });

        const fee = {
            type: 'free-transfer' as const
        };
        if (availableTransfers < 1) {
            throw new TronNotEnoughBalanceEstimationError('No available free transfers', fee);
        }

        return {
            fee,
            resources
        };
    }

    private async formatBatteryError(e: unknown) {
        if (e && typeof e === 'object' && 'response' in e && e.response instanceof Response) {
            const message = await e.response.text();
            if (message.includes('Not enough balance')) {
                return new NotEnoughBatteryBalanceError(errorMessage(e)!);
            }
        }

        return e;
    }
}
