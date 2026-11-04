import { EstimateResourcesRequest } from '../../../tronApi';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TronAsset } from '../../../entries/crypto/asset/tron-asset';
import { TRON_USDT_ASSET } from '../../../entries/crypto/asset/constants';
import { assertTronTransactionMatches, evmHexFromTronAddress } from '../tron-transaction';

export class TronTrc20Encoder {
    public static transferDefaultResources = {
        energy: 64285,
        bandwidth: 345
    };

    private static transferSelector = 'transfer(address,uint256)';

    private static transferSelectorHex = 'a9059cbb';

    /** Sun; tronweb's own default, passed explicitly so the built transaction can be checked against it. */
    private static transferFeeLimit = 150_000_000;

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

    private async encodeTransferParameter(to: string, assetAmount: AssetAmount<TronAsset>) {
        const { AbiCoder } = await import('ethers');
        return new AbiCoder()
            .encode(
                ['address', 'uint256'],
                [evmHexFromTronAddress(to), assetAmount.weiAmount.toFixed(0)]
            )
            .replace(/^(0x)/, '');
    }

    async encodeTransferEstimateRequest(
        to: string,
        assetAmount: AssetAmount<TronAsset>
    ): Promise<EstimateResourcesRequest> {
        if (assetAmount.asset.id !== TRON_USDT_ASSET.id) {
            throw new Error(`Unsupported tron asset ${assetAmount.asset.symbol}`);
        }

        return {
            from: this.walletAddress,
            contractAddress: assetAmount.asset.address,
            selector: TronTrc20Encoder.transferSelector,
            data: await this.encodeTransferParameter(to, assetAmount)
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

        const parameter = [
            { type: 'address', value: to },
            { type: 'uint256', value: assetAmount.weiAmount.toFixed(0) }
        ];
        const { transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
            assetAmount.asset.address,
            TronTrc20Encoder.transferSelector,
            { feeLimit: TronTrc20Encoder.transferFeeLimit },
            parameter,
            this.walletAddress
        );

        /**
         * set tx lifetime to 10 minutes
         */
        const extended = await tronWeb.transactionBuilder.extendExpiration(transaction, 60 * 10);

        assertTronTransactionMatches(extended, {
            contract: {
                type: 'triggerSmartContract',
                owner: this.walletAddress,
                contract: assetAmount.asset.address,
                callValue: 0n,
                data:
                    TronTrc20Encoder.transferSelectorHex +
                    (await this.encodeTransferParameter(to, assetAmount))
            },
            feeLimit: BigInt(TronTrc20Encoder.transferFeeLimit)
        });

        return extended;
    }
}
