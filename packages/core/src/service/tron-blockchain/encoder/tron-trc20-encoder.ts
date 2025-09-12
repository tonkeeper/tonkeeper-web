import { EstimateResourcesRequest } from '../../../tronApi';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TronAsset } from '../../../entries/crypto/asset/tron-asset';
import { TronAddressUtils } from '@ton-keychain/trx';
import { TRON_USDT_ASSET } from '../../../entries/crypto/asset/constants';

export class TronTrc20Encoder {
    public static transferDefaultResources = {
        energy: 64285,
        bandwidth: 345
    };

    private static transferSelector = 'transfer(address,uint256)';

    private readonly walletAddress: string;

    private readonly tronGridBaseUrl: string;

    constructor({
        walletAddress,
        tronGridBaseUrl
    }: {
        walletAddress: string;
        tronGridBaseUrl: string;
    }) {
        this.walletAddress = walletAddress;
        this.tronGridBaseUrl = tronGridBaseUrl;
    }

    async encodeTransferEstimateRequest(
        to: string,
        assetAmount: AssetAmount<TronAsset>
    ): Promise<EstimateResourcesRequest> {
        if (assetAmount.asset.id !== TRON_USDT_ASSET.id) {
            throw new Error(`Unsupported tron asset ${assetAmount.asset.symbol}`);
        }

        const { AbiCoder } = await import('ethers');

        return {
            from: this.walletAddress,
            contractAddress: assetAmount.asset.address,
            selector: TronTrc20Encoder.transferSelector,
            data: new AbiCoder()
                .encode(
                    ['address', 'uint256'],
                    [TronAddressUtils.base58ToHex(to), assetAmount.weiAmount.toString()]
                )
                .replace(/^(0x)/, '')
        };
    }

    async encodeTransferTransaction(to: string, assetAmount: AssetAmount<TronAsset>) {
        if (assetAmount.asset.id !== TRON_USDT_ASSET.id) {
            throw new Error(`Unsupported tron asset ${assetAmount.asset.symbol}`);
        }

        const { TronWeb } = await import('tronweb');
        const tronWeb = new TronWeb({
            fullHost: this.tronGridBaseUrl,
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
            this.walletAddress
        );

        /**
         * set tx lifetime to 10 minutes
         */
        return tronWeb.transactionBuilder.extendExpiration(transaction, 60 * 10);
    }
}
