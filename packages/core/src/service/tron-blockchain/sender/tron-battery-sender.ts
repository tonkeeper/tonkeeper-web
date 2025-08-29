import { TronApi, TronResources } from '../../../tronApi';
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
import { TransactionFeeBattery } from '../../../entries/crypto/transaction-fee';
import BigNumber from 'bignumber.js';
import { TronNotEnoughBalanceEstimationError } from '../../../errors/TronNotEnoughBalanceEstimationError';

export class TronBatterySender implements ITronSender {
    private batteryApi: BatteryApi;

    private trc20Encoder: TronTrc20Encoder;

    constructor(
        private tronApi: TronApi,
        batteryConfig: BatteryConfiguration,
        private walletInfo: TronWallet,
        private tronSigner: TronSigner,
        private batteryTonUnitRate: BigNumber,
        private readonly xTonConnectAuth: string
    ) {
        this.batteryApi = new BatteryApi(batteryConfig);
        this.trc20Encoder = new TronTrc20Encoder({
            walletAddress: this.walletInfo.address,
            tronGridBaseUrl: this.tronApi.tronGridBaseUrl
        });
    }

    async send(to: string, assetAmount: AssetAmount<TronAsset>, estimation: TronEstimation) {
        const signedTx = await this.tronSigner(
            await this.trc20Encoder.encodeTransferTransaction(to, assetAmount)
        );

        try {
            await this.batteryApi.tronSend({
                xTonConnectAuth: this.xTonConnectAuth,
                tronSendRequest: {
                    tx: Buffer.from(JSON.stringify(signedTx)).toString('base64'),
                    wallet: this.walletInfo.address,
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
        const resources = await this.tronApi.applyResourcesSafetyMargin(
            await this.tronApi.estimateResources(
                await this.trc20Encoder.encodeTransferEstimateRequest(to, assetAmount)
            )
        );

        const bandwidhAvailable = await this.tronApi.getAccountBandwidth(this.walletInfo.address);
        resources.bandwidth = Math.max(0, resources.bandwidth - bandwidhAvailable);

        const estimation = await this.batteryApi.tronEstimate({
            wallet: this.walletInfo.address,
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
