import BigNumber from 'bignumber.js';
import { TRON_USDT_ASSET } from '../entries/crypto/asset/constants';
import { TronWeb } from 'tronweb';
import { TronAsset } from '../entries/crypto/asset/tron-asset';
import { AssetAmount } from '../entries/crypto/asset/asset-amount';
import { notNullish } from '../utils/types';
import { Configuration, DefaultApi, EstimatedTronTx } from '../batteryApi';
import type { Transaction } from 'tronweb/lib/commonjs/types';
import { TransactionFee } from '../entries/crypto/transaction-fee';

const removeTrailingSlash = (str: string) => str.replace(/\/$/, '');

type TronTokenDTO = {
    transaction_id: string; // no 0x
    token_info: {
        address: string;
    };
    block_timestamp: number; // ms
    from: string;
    to: string;
    type: 'Transfer';
    value: string;
};

export type TronHistoryItemTransferAsset = {
    type: 'asset-transfer';
    assetAmount: AssetAmount<TronAsset>;
    timestamp: number;
    transactionHash: string;
    from: string;
    to: string;
    isScam: boolean;
    isFailed: boolean;
    fee?: TransactionFee;
    inProgress?: boolean;
};
export type TronHistoryItem = TronHistoryItemTransferAsset;

export type TronResources = {
    energy: number;
    bandwidth: number;
};

export class TronApi {
    public readonly tronGridBaseUrl: string;

    private readonly batteryApi: DefaultApi;

    public get headers() {
        return {
            ...(this.trongrid.apiKey && {
                'TRON-PRO-API-KEY': this.trongrid.apiKey
            }),
            'Content-Type': 'application/json'
        };
    }

    private safetyMargin: number | undefined;

    constructor(
        private readonly trongrid: { baseURL: string; readonly apiKey?: string },
        batteryConfig: Configuration
    ) {
        this.tronGridBaseUrl = removeTrailingSlash(trongrid.baseURL);
        this.batteryApi = new DefaultApi(batteryConfig);
    }

    async getBalances(address: string) {
        const res = await (
            await fetch(`${this.tronGridBaseUrl}/v1/accounts/${address}`, {
                headers: this.headers
            })
        ).json();

        if (!res?.success || !res?.data) {
            throw new Error('Fetch tron balances failed');
        }

        const info = res?.data?.[0];
        if (!info) {
            return {
                trx: '0',
                usdt: await this.getUSDTBalance(address)
            };
        }

        let trx = '0';
        let usdt = '0';
        if (info.balance !== undefined) {
            const trxBalance = parseInt(info.balance);
            if (isFinite(trxBalance)) {
                trx = new BigNumber(trxBalance).toFixed(0);
            } else {
                throw new Error('Invalid tron balance');
            }
        }

        if (info.trc20 && Array.isArray(info.trc20)) {
            const usdtBalance = info.trc20.find(
                (obj: Record<string, string>) => TRON_USDT_ASSET.address in obj
            )?.[TRON_USDT_ASSET.address];

            if (usdtBalance !== undefined) {
                const parsed = parseInt(usdtBalance);
                if (isFinite(parsed)) {
                    usdt = new BigNumber(parsed).toFixed(0);
                } else {
                    throw new Error('Invalid tron usdt balance');
                }
            }
        }

        return {
            trx,
            usdt
        };
    }

    public async sendTransaction(
        tx: Transaction,
        fromWallet: string,
        resources: TronResources,
        options: { xTonConnectAuth: string }
    ) {
        return this.batteryApi.tronSend({
            xTonConnectAuth: options.xTonConnectAuth,
            tronSendRequest: {
                tx: Buffer.from(JSON.stringify(tx)).toString('base64'),
                wallet: fromWallet,
                energy: resources.energy,
                bandwidth: resources.bandwidth
            }
        });
    }

    public async estimateBatteryCharges(params: {
        from: string;
        contractAddress: string;
        selector: string;
        data: string;
    }): Promise<{ estimation: EstimatedTronTx; resources: TronResources }> {
        const resources = await this.applyResourcesSafetyMargin(
            await this.estimateResources(params)
        );
        const bandwidhAvailable = await this.getAccountBandwidth(params.from);

        resources.bandwidth = Math.max(0, resources.bandwidth - bandwidhAvailable);

        const estimation = await this.batteryApi.tronEstimate({
            wallet: params.from,
            ...resources
        });

        return {
            estimation,
            resources
        };
    }

    private async getAccountBandwidth(address: string): Promise<number> {
        const res = await (
            await fetch(`${this.tronGridBaseUrl}/v1/accounts/${address}`, {
                headers: this.headers
            })
        ).json();

        if (!res?.success || !res?.data) {
            throw new Error('Fetch tron balances failed');
        }

        const info = res?.data?.[0];
        if (!info) {
            return 0;
        }

        return info.free_net_usage || 0;
    }

    private async applyResourcesSafetyMargin(resources: TronResources) {
        const { energy, bandwidth } = resources;

        if (this.safetyMargin === undefined) {
            const config = await this.batteryApi.getTronConfig();
            const backendMargin = parseInt(config.safetyMarginPercent);
            this.safetyMargin = (isFinite(backendMargin) ? backendMargin : 3) / 100;
        }

        return {
            energy: Math.ceil(energy * (1 + this.safetyMargin)),
            bandwidth: Math.ceil(bandwidth * (1 + this.safetyMargin))
        };
    }

    private async estimateResources(params: {
        from: string;
        contractAddress: string;
        selector: string;
        data: string;
    }): Promise<TronResources> {
        try {
            const response = await (
                await fetch(`${this.tronGridBaseUrl}/wallet/triggerconstantcontract`, {
                    method: 'POST',
                    headers: this.headers,
                    body: JSON.stringify({
                        owner_address: params.from,
                        contract_address: params.contractAddress,
                        function_selector: params.selector,
                        parameter: params.data,
                        visible: true
                    })
                })
            ).json();

            if (response.result.result !== true) {
                throw new Error('Estimating energy error');
            }

            if (!('energy_used' in response)) {
                throw new Error('Estimating energy error');
            }
            const energy = Number.parseInt(response.energy_used);

            if (!isFinite(energy)) {
                throw new Error('Estimating energy error');
            }

            if (!response.transaction || !response.transaction.raw_data_hex) {
                throw new Error('Transaction data missing in response');
            }

            /**
             * https://developers.tron.network/docs/faq#5-how-to-calculate-the-bandwidth-and-energy-consumed-when-callingdeploying-a-contract
             */
            const DATA_HEX_PROTOBUF_EXTRA = 9;
            const MAX_RESULT_SIZE_IN_TX = 64;
            const A_SIGNATURE = 67;

            const bandwidth =
                Buffer.from(response.transaction.raw_data_hex, 'hex').length +
                DATA_HEX_PROTOBUF_EXTRA +
                MAX_RESULT_SIZE_IN_TX +
                A_SIGNATURE;

            return { energy, bandwidth };
        } catch (error) {
            console.error('Error estimating energy:', error);
            throw error;
        }
    }

    async getUSDTBalance(of: string) {
        try {
            const abi = [
                {
                    outputs: [{ type: 'uint256' }],
                    constant: true,
                    inputs: [{ name: 'who', type: 'address' }],
                    name: 'balanceOf',
                    stateMutability: 'View',
                    type: 'Function'
                },
                {
                    outputs: [{ type: 'bool' }],
                    inputs: [
                        { name: '_to', type: 'address' },
                        { name: '_value', type: 'uint256' }
                    ],
                    name: 'transfer',
                    stateMutability: 'Nonpayable',
                    type: 'Function'
                }
            ];
            const contract = new TronWeb({ fullHost: this.tronGridBaseUrl }).contract(
                abi,
                TRON_USDT_ASSET.address
            );
            const res = await contract.balanceOf(of).call({ from: of });

            if (typeof res !== 'bigint' && typeof res !== 'number' && typeof res !== 'string') {
                throw new Error('Error fetching usdt balance');
            }

            const parsed = new BigNumber(res.toString());
            if (!parsed.isFinite()) {
                throw new Error('Error fetching usdt balance');
            }

            return parsed.toFixed(0);
        } catch (error) {
            console.error('Error estimating energy:', error);
            return '0';
        }
    }

    async rpc(method: string, params: string[] = []) {
        try {
            const response = await (
                await fetch(`${this.tronGridBaseUrl}/jsonrpc`, {
                    method: 'POST',
                    headers: this.headers,
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 1,
                        method,
                        params
                    })
                })
            ).json();

            if ('error' in response) {
                throw new Error(response.error);
            }

            if (!('result' in response)) {
                throw new Error('RPC error');
            }

            return response.result;
        } catch (error) {
            console.error('Error estimating energy:', error);
            throw error;
        }
    }

    async getTransfersHistory(
        address: string,
        options?: {
            limit?: number;
            maxTimestamp?: number;
            onlyInitiator?: boolean;
            filterSpam?: boolean;
        },
        batteryAuthToken?: string
    ): Promise<TronHistoryItem[]> {
        const trongridHistory = await this.getBlockchainTransfersHistory(address, options);
        const batteryHistory = await this.getBatteryTransfersHistory(options, batteryAuthToken);

        return batteryHistory
            .concat(
                trongridHistory.filter(item =>
                    batteryHistory.every(i => i.transactionHash !== item.transactionHash)
                )
            )
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    private async getBlockchainTransfersHistory(
        address: string,
        options?: {
            limit?: number;
            maxTimestamp?: number;
            onlyInitiator?: boolean;
            filterSpam?: boolean;
        }
    ): Promise<TronHistoryItem[]> {
        const url = new URL(`${this.tronGridBaseUrl}/v1/accounts/${address}/transactions/trc20`);

        if (options?.limit !== undefined) {
            url.searchParams.set('limit', options.limit.toString());
        }

        if (options?.maxTimestamp !== undefined) {
            url.searchParams.set('max_timestamp', options.maxTimestamp.toString());
        }

        if (options?.onlyInitiator === true) {
            url.searchParams.set('only_from', 'true');
        }

        const response = await (
            await fetch(url, {
                method: 'GET',
                headers: this.headers
            })
        ).json();

        if (!response?.success || !response?.data || !Array.isArray(response.data)) {
            throw new Error('Error fetching transfers history');
        }

        return response.data
            .map((item: TronTokenDTO) => {
                if (item.type !== 'Transfer') {
                    return null;
                }
                if (item.token_info?.address !== TRON_USDT_ASSET.address) {
                    return null;
                }

                const assetAmount = new AssetAmount({
                    weiAmount: item.value,
                    asset: TRON_USDT_ASSET
                });

                const isScam = item.to === address && assetAmount.relativeAmount.lt(1);

                if (options?.filterSpam && isScam) {
                    return null;
                }

                return {
                    type: 'asset-transfer',
                    assetAmount,
                    timestamp: item.block_timestamp,
                    transactionHash: item.transaction_id,
                    from: item.from,
                    to: item.to,
                    isScam,
                    isFailed: false,
                    inProgress: false
                } satisfies TronHistoryItemTransferAsset;
            })
            .filter(notNullish);
    }

    private async getBatteryTransfersHistory(
        options?: {
            limit?: number;
            maxTimestamp?: number;
        },
        batteryAuthToken?: string
    ): Promise<TronHistoryItem[]> {
        if (!batteryAuthToken) {
            return [];
        }

        const response = await this.batteryApi.getTronTransactions({
            xTonConnectAuth: batteryAuthToken,
            maxTimestamp: options?.maxTimestamp,
            limit: options?.limit
        });

        return response.transactions
            .map(item => {
                const assetAmount = new AssetAmount({
                    weiAmount: item.amount,
                    asset: TRON_USDT_ASSET
                });

                return {
                    type: 'asset-transfer',
                    assetAmount,
                    timestamp: item.timestamp * 1000,
                    transactionHash: item.txid,
                    from: item.fromAccount,
                    to: item.toAccount,
                    isScam: false,
                    isFailed: item.isFailed,
                    inProgress: item.isPending,
                    fee: {
                        type: 'battery' as const,
                        charges: item.batteryCharges
                    }
                } satisfies TronHistoryItemTransferAsset;
            })
            .filter(notNullish);
    }
}
