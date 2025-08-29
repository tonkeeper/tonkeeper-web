import BigNumber from 'bignumber.js';
import { TON_ASSET, TRON_TRX_ASSET, TRON_USDT_ASSET } from '../entries/crypto/asset/constants';
import { TronAsset } from '../entries/crypto/asset/tron-asset';
import { AssetAmount } from '../entries/crypto/asset/asset-amount';
import { notNullish } from '../utils/types';
import { Configuration, DefaultApi } from '../batteryApi';
import { TronTransactionFee } from '../entries/crypto/transaction-fee';
import { cachedAsync, withRetry } from '../utils/common';
import type { SignedTransaction } from 'tronweb/src/types/Transaction';

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
    fee?: TronTransactionFee;
    inProgress?: boolean;
};
export type TronHistoryItem = TronHistoryItemTransferAsset;

export type TronResources = {
    energy: number;
    bandwidth: number;
};

export type TronResourcePrices = {
    energy: AssetAmount<TronAsset>;
    bandwidth: AssetAmount<TronAsset>;
};

export type EstimateResourcesRequest = {
    from: string;
    contractAddress: string;
    selector: string;
    data: string;
};

const maxRetries = 5;

const defaultRetryConfig = {
    maxRetries: maxRetries,
    delayMs: 3000
};

const defaultCacheTime = 5000;

function decorateApi<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    overrideConfig?: {
        cacheTime?: number;
        maxRetries?: number;
        shouldRetry?: (error: unknown) => boolean;
        delayMs?: number;
    }
) {
    const { cacheTime, ...retryConfig } = overrideConfig ?? {};

    return cachedAsync(
        cacheTime ?? defaultCacheTime,
        withRetry(fn, { ...defaultRetryConfig, ...retryConfig })
    );
}

export class TronApi {
    readonly tronGridBaseUrl: string;

    private readonly batteryApi: DefaultApi;

    get headers() {
        return {
            'Content-Type': 'application/json'
        };
    }

    constructor(
        trongrid: { baseURL: string; readonly apiKey?: string },
        batteryConfig: Configuration
    ) {
        this.tronGridBaseUrl = removeTrailingSlash(trongrid.baseURL);
        this.batteryApi = new DefaultApi(batteryConfig);
    }

    public getBalances = decorateApi(async (address: string) => {
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
    });

    public getAccountBandwidth = decorateApi(async (address: string): Promise<number> => {
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
    });

    public estimateResources = decorateApi(
        async (params: EstimateResourcesRequest): Promise<TronResources> => {
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
    );

    public broadcastSignedTransaction = decorateApi(
        async (signedTx: SignedTransaction) => {
            const res = await fetch(`${this.tronGridBaseUrl}/wallet/broadcasttransaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signedTx)
            });

            const json = await res.json();

            if (!json.result) {
                console.error('Broadcast failed:', json);
                throw new Error(json.message || 'Broadcast failed');
            }
        },
        { cacheTime: 0, maxRetries: 3 }
    );

    public getResourcePrices = decorateApi(
        async (): Promise<TronResourcePrices> => {
            const res = await fetch(`${this.tronGridBaseUrl}/wallet/getchainparameters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();
            const params: { key: string; value: string | number }[] = Array.isArray(
                data.chainParameter
            )
                ? data.chainParameter
                : [];

            const getValue = (key: string): number | undefined => {
                const param = params.find(p => p.key === key);
                return param && typeof param.value === 'number' ? param.value : undefined;
            };

            const energySun = getValue('getEnergyFee');
            const bandwidthSun = getValue('getTransactionFee');

            if (!energySun || !bandwidthSun) {
                throw new Error('Missing or invalid energy or bandwidth price in chain parameters');
            }

            return {
                energy: new AssetAmount({ weiAmount: energySun, asset: TRON_TRX_ASSET }),
                bandwidth: new AssetAmount({ weiAmount: bandwidthSun, asset: TRON_TRX_ASSET })
            };
        },
        { cacheTime: Infinity }
    );

    public async applyResourcesSafetyMargin(resources: TronResources) {
        const { energy, bandwidth } = resources;

        const config = await this.getTronConfig();
        const backendMargin = parseInt(config.safetyMarginPercent);
        const safetyMargin = (isFinite(backendMargin) ? backendMargin : 3) / 100;

        return {
            energy: Math.ceil(energy * (1 + safetyMargin)),
            bandwidth: Math.ceil(bandwidth * (1 + safetyMargin))
        };
    }

    private getTronConfig = decorateApi(() => this.batteryApi.getTronConfig());

    public async getTransfersHistory(
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

    private getBlockchainTransfersHistory = decorateApi(
        async (
            address: string,
            options?: {
                limit?: number;
                maxTimestamp?: number;
                onlyInitiator?: boolean;
                filterSpam?: boolean;
            }
        ): Promise<TronHistoryItem[]> => {
            const url = new URL(
                `${this.tronGridBaseUrl}/v1/accounts/${address}/transactions/trc20`
            );

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

                    const isScam = item.to === address && assetAmount.relativeAmount.lt(0.01);

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
    );

    private getUSDTBalance = decorateApi(async (of: string) => {
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
            const { TronWeb } = await import('tronweb');
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
    });

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
                    fee:
                        item.feeType === 'ton' && item.feeTonNano
                            ? {
                                  type: 'ton-asset-relayed' as const,
                                  extra: new AssetAmount({
                                      asset: TON_ASSET,
                                      weiAmount: item.feeTonNano! * -1
                                  }),
                                  sendToAddress: ''
                              }
                            : {
                                  type: 'battery' as const,
                                  charges: item.batteryCharges
                              }
                } satisfies TronHistoryItemTransferAsset;
            })
            .filter(notNullish);
    }
}
