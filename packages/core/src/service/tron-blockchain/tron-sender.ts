import { ethers } from 'ethers';
import { TronApi } from '../../tronApi';
import { TRON_TRX_ASSET, TRON_USDT_ASSET } from '../../entries/crypto/asset/constants';
import { AssetAmount } from '../../entries/crypto/asset/asset-amount';
import { TronAsset } from '../../entries/crypto/asset/tron-asset';
import BigNumber from 'bignumber.js';
import { TronSigner } from '../../entries/signer';
import { TronWallet } from '../../entries/tron/tron-wallet';
import { TronAddressUtils } from '@ton-keychain/trx';
import { TronWeb } from 'tronweb';
const AbiCoder = ethers.AbiCoder;

const toHexAddress = (base58: string) => {
    return ethers.getAddress(TronAddressUtils.base58ToHex(base58));
};

export class TronSender {
    private static transferSelector = 'transfer(address,uint256)';

    constructor(
        private tronApi: TronApi,
        private walletInfo: TronWallet,
        private tronSigner: TronSigner
    ) {}

    async send(to: string, assetAmount: AssetAmount<TronAsset>) {
        if (assetAmount.asset.id !== TRON_USDT_ASSET.id) {
            throw new Error(`Unsupported tron asset ${assetAmount.asset.symbol}`);
        }

        const tronWeb = new TronWeb({
            fullHost: this.tronApi.baseURL
        });

        const functionSelector = 'transfer(address,uint256)';
        const parameter = [
            { type: 'address', value: to },
            { type: 'uint256', value: assetAmount.weiAmount.toFixed(0) }
        ];
        const tx = await tronWeb.transactionBuilder.triggerSmartContract(
            assetAmount.asset.address,
            functionSelector,
            {},
            parameter,
            this.walletInfo.address
        );

        const signedTx = await this.tronSigner(tx.transaction);
        const result = await tronWeb.trx.sendRawTransaction(signedTx);

        if (!result.result) {
            throw new Error('err');
        }
    }

    async estimate(to: string, assetAmount: AssetAmount<TronAsset>) {
        if (assetAmount.asset.id !== TRON_USDT_ASSET.id) {
            throw new Error(`Unsupported tron asset ${assetAmount.asset.symbol}`);
        }

        const estimatedGas = await this.tronApi.estimateEnergy({
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

        const gasPrice = parseInt(await this.tronApi.rpc('eth_gasPrice'));

        const trxToBurn = estimatedGas * gasPrice;

        return {
            extra: new AssetAmount({
                weiAmount: new BigNumber(trxToBurn.toString()),
                asset: TRON_TRX_ASSET
            })
        };
    }
}
