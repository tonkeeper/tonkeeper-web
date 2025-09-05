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
import { TransactionFeeBattery } from '../../../entries/crypto/transaction-fee';
import BigNumber from 'bignumber.js';
import { TronNotEnoughBalanceEstimationError } from '../../../errors/TronNotEnoughBalanceEstimationError';

export class TronBatterySender extends BaseTronSender implements ITronSender {
    private batteryApi: BatteryApi;

    protected trc20Encoder: TronTrc20Encoder;

    constructor(
        protected tronApi: TronApi,
        batteryConfig: BatteryConfiguration,
        protected tronWallet: TronWallet,
        private tronSigner: TronSigner,
        private batteryTonUnitRate: BigNumber,
        private readonly xTonConnectAuth: string
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
                xTonConnectAuth: this.xTonConnectAuth,
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
        fee: TransactionFeeBattery;
        resources: TronResources;
    }> {
        const resources = await this.estimateTransferResources(to, assetAmount);

        const estimation = await this.batteryApi.tronEstimate({
            wallet: this.tronWallet.address,
            ...resources
        });

        const batteryBalance = await this.batteryApi.getBalance({
            xTonConnectAuth: this.xTonConnectAuth,
            units: 'ton'
        });

        const chargesBalance = new BigNumber(batteryBalance.balance)
            .div(this.batteryTonUnitRate)
            .integerValue(BigNumber.ROUND_FLOOR);

        const fee = {
            type: 'battery' as const,
            charges: estimation.totalCharges
        };
        if (chargesBalance.lt(estimation.totalCharges)) {
            throw new TronNotEnoughBalanceEstimationError('Not enough battery balance', fee);
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
