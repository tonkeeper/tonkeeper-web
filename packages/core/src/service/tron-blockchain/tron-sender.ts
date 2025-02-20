import { ethers } from 'ethers';
import { TronApi, TronResources } from '../../tronApi';
import { TRON_USDT_ASSET } from '../../entries/crypto/asset/constants';
import { AssetAmount } from '../../entries/crypto/asset/asset-amount';
import { TronAsset } from '../../entries/crypto/asset/tron-asset';
import { TronSigner } from '../../entries/signer';
import { TronWallet } from '../../entries/tron/tron-wallet';
import { TronAddressUtils } from '@ton-keychain/trx';
import { TronWeb } from 'tronweb';
import { TronEstimation } from '../../entries/send';
const AbiCoder = ethers.AbiCoder;

const toHexAddress = (base58: string) => {
    return ethers.getAddress(TronAddressUtils.base58ToHex(base58));
};

export class TronSender {
    private static transferSelector = 'transfer(address,uint256)';

    constructor(
        private tronApi: TronApi,
        private walletInfo: TronWallet,
        private tronSigner: TronSigner,
        private readonly xTonConnectAuth: string
    ) {}

    async send(to: string, assetAmount: AssetAmount<TronAsset>, resources: TronResources) {
        if (assetAmount.asset.id !== TRON_USDT_ASSET.id) {
            throw new Error(`Unsupported tron asset ${assetAmount.asset.symbol}`);
        }

        const tronWeb = new TronWeb({
            fullHost: this.tronApi.tronGridBaseUrl,
            privateKey: undefined
        });

        const functionSelector = 'transfer(address,uint256)';
        const parameter = [
            { type: 'address', value: to },
            { type: 'uint256', value: assetAmount.weiAmount.toFixed(0) }
        ];
        const { transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
            assetAmount.asset.address,
            functionSelector,
            {},
            parameter,
            this.walletInfo.address
        );

        /**
         * set tx lifetime to 10 minutes
         */
        const transactionExtended = await tronWeb.transactionBuilder.extendExpiration(
            transaction,
            60 * 10
        );

        const signedTx = await this.tronSigner(transactionExtended);
        await this.tronApi.sendTransaction(signedTx, this.walletInfo.address, resources, {
            xTonConnectAuth: this.xTonConnectAuth
        });
    }

    async estimate(to: string, assetAmount: AssetAmount<TronAsset>): Promise<TronEstimation> {
        if (assetAmount.asset.id !== TRON_USDT_ASSET.id) {
            throw new Error(`Unsupported tron asset ${assetAmount.asset.symbol}`);
        }

        const { estimation, resources } = await this.tronApi.estimateBatteryCharges({
            from: this.walletInfo.address,
            contractAddress: assetAmount.asset.address,
            selector: TronSender.transferSelector,
            data: new AbiCoder()
                .encode(
                    ['address', 'uint256'],
                    [toHexAddress(to), assetAmount.weiAmount.toString()]
                )
                .replace(/^(0x)/, '')
        });

        return {
            fee: {
                type: 'battery' as const,
                charges: estimation.totalCharges
            },
            resources
        };
    }
}
