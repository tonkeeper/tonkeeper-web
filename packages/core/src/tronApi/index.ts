import BigNumber from 'bignumber.js';
import { decodeBase58, toBeHex } from 'ethers';
import { TON_ASSET, TRON_TRX_ASSET, TRON_USDT_ASSET } from '../entries/crypto/asset/constants';
import { TronAsset } from '../entries/crypto/asset/tron-asset';
import { AssetAmount } from '../entries/crypto/asset/asset-amount';
import { notNullish } from '../utils/types';
import { Configuration, DefaultApi } from '../batteryApi';
import { TronTransactionFee } from '../entries/crypto/transaction-fee';
import { cachedAsync } from '../utils/common';
import { tronFetch } from './tronGridTransport';
import type { SignedTransaction } from 'tronweb/src/types/Transaction';
import { joinUrl } from '../utils/url';

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

const defaultCacheTime = 5000;

const USDT_BALANCE_OF_SELECTOR = '70a08231';

/** The 20-byte account id: base58check minus the 0x41 network prefix and the checksum. */
const tronAddressBody = (address: string) => toBeHex(decodeBase58(address), 25).slice(4, 44);

const parseQuantity = (value: unknown): string | undefined => {
    if (typeof value !== 'string' || !/^0x[0-9a-f]+$/i.test(value)) {
        return undefined;
    }
    return BigInt(value).toString();
};

export type TronAccountBalances = { trx: string; usdt: string };

/** TronGrid returns the broadcast `message` bytes hex-encoded for non-`visible` transactions. */
export const decodeBroadcastMessage = (message: unknown): string | undefined => {
    if (typeof message !== 'string' || !message) {
        return undefined;
    }
    if (message.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(message)) {
        return message;
    }
    return Buffer.from(message, 'hex').toString('utf8');
};

function decorateApi<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    overrideConfig?: { cacheTime?: number }
) {
    return cachedAsync(overrideConfig?.cacheTime ?? defaultCacheTime, fn);
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
        this.tronGridBaseUrl = trongrid.baseURL;
        this.batteryApi = new DefaultApi(batteryConfig);
    }

    /**
     * One JSON-RPC batch with eth_getBalance + eth_call(balanceOf) per owner: TronGrid counts
     * the whole batch as a single request, so N addresses cost one slot of the per-method budget
     * instead of 2N. Owners with a failed or unparsable entry are left out, not zeroed — an
     * unanswered entry is not a zero balance.
     */
    public async getBalancesBatch(addresses: string[]): Promise<Map<string, TronAccountBalances>> {
        const result = new Map<string, TronAccountBalances>();
        if (addresses.length === 0) {
            return result;
        }

        const usdtContract = tronAddressBody(TRON_USDT_ASSET.address);
        const payload = addresses.flatMap((address, index) => {
            const owner = tronAddressBody(address);
            return [
                {
                    jsonrpc: '2.0',
                    method: 'eth_getBalance',
                    params: [owner, 'latest'],
                    id: `trx-${index}`
                },
                {
                    jsonrpc: '2.0',
                    method: 'eth_call',
                    params: [
                        {
                            to: usdtContract,
                            data: USDT_BALANCE_OF_SELECTOR + owner.padStart(64, '0')
                        },
                        'latest'
                    ],
                    id: `usdt-${index}`
                }
            ];
        });

        const httpRes = await tronFetch(joinUrl(this.tronGridBaseUrl, '/jsonrpc'), {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(payload)
        });
        const items: unknown = await httpRes.json();
        if (!Array.isArray(items)) {
            throw new Error('Invalid tron balances batch response');
        }

        const quantityById = new Map<string, string>();
        for (const item of items) {
            const quantity = parseQuantity(item?.result);
            if (typeof item?.id === 'string' && quantity !== undefined) {
                quantityById.set(item.id, quantity);
            }
        }

        addresses.forEach((address, index) => {
            const trx = quantityById.get(`trx-${index}`);
            const usdt = quantityById.get(`usdt-${index}`);
            if (trx !== undefined && usdt !== undefined) {
                result.set(address, { trx, usdt });
            }
        });

        return result;
    }

    public getBalances = decorateApi(async (address: string): Promise<TronAccountBalances> => {
        const httpRes = await tronFetch(joinUrl(this.tronGridBaseUrl, `/v1/accounts/${address}`), {
            headers: this.headers
        });

        const res = await httpRes.json();

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

    /** TronGrid answers `{}` for an account that never received TRX. */
    public isAccountActivated = decorateApi(async (address: string): Promise<boolean> => {
        const httpRes = await tronFetch(joinUrl(this.tronGridBaseUrl, '/wallet/getaccount'), {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({ address, visible: true })
        });
        const account = await httpRes.json();
        return !!account?.address || account?.create_time !== undefined;
    });

    public getAccountBandwidth = decorateApi(
        async (address: string): Promise<number> => {
            const httpRes = await tronFetch(
                joinUrl(this.tronGridBaseUrl, '/wallet/getaccountnet'),
                {
                    headers: this.headers,
                    method: 'post',
                    body: JSON.stringify({
                        address,
                        visible: true
                    })
                }
            );
            const res = await httpRes.json();

            if (!res.freeNetLimit) {
                return 0;
            }

            const freeNetLimit = Number(res.freeNetLimit);
            const freeNetUsed = Number(res.freeNetUsed ?? 0);
            if (!isFinite(freeNetLimit) || !isFinite(freeNetUsed)) {
                return 0;
            }

            return Math.max(0, freeNetLimit - freeNetUsed);
        },
        { cacheTime: 60_000 }
    );

    public estimateResources = decorateApi(
        async (params: EstimateResourcesRequest): Promise<TronResources> => {
            try {
                const httpRes = await tronFetch(
                    joinUrl(this.tronGridBaseUrl, '/wallet/triggerconstantcontract'),
                    {
                        method: 'POST',
                        headers: this.headers,
                        body: JSON.stringify({
                            owner_address: params.from,
                            contract_address: params.contractAddress,
                            function_selector: params.selector,
                            parameter: params.data,
                            visible: true
                        })
                    }
                );
                const response = await httpRes.json();

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

                const bandwidth = this.estimateBandwidth(response.transaction.raw_data_hex);

                return { energy, bandwidth };
            } catch (error) {
                console.error('Error estimating energy:', error);
                throw error;
            }
        },
        { cacheTime: 60_000 }
    );

    public estimateBandwidth(transactionRawDataHex: string) {
        /**
         * https://developers.tron.network/docs/faq#5-how-to-calculate-the-bandwidth-and-energy-consumed-when-callingdeploying-a-contract
         */
        const DATA_HEX_PROTOBUF_EXTRA = 9;
        const MAX_RESULT_SIZE_IN_TX = 64;
        const A_SIGNATURE = 67;

        return (
            Buffer.from(transactionRawDataHex, 'hex').length +
            DATA_HEX_PROTOBUF_EXTRA +
            MAX_RESULT_SIZE_IN_TX +
            A_SIGNATURE
        );
    }

    public broadcastSignedTransaction = decorateApi(
        async (signedTx: SignedTransaction) => {
            const res = await tronFetch(
                joinUrl(this.tronGridBaseUrl, '/wallet/broadcasttransaction'),
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(signedTx)
                }
            );
            const json = await res.json();

            if (!json.result) {
                console.error(
                    `Broadcast failed: ${json.code ?? 'unknown code'}: ${
                        decodeBroadcastMessage(json.message) ?? 'no message'
                    }`
                );
                throw new Error(decodeBroadcastMessage(json.message) || 'Broadcast failed');
            }
        },
        { cacheTime: 0 }
    );

    private getChainParameters = decorateApi(
        async (): Promise<(key: string) => number | undefined> => {
            const res = await tronFetch(
                joinUrl(this.tronGridBaseUrl, '/wallet/getchainparameters'),
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            const data = await res.json();
            const params: { key: string; value: string | number }[] = Array.isArray(
                data.chainParameter
            )
                ? data.chainParameter
                : [];

            return (key: string): number | undefined => {
                const param = params.find(p => p.key === key);
                return param && typeof param.value === 'number' ? param.value : undefined;
            };
        },
        { cacheTime: Infinity }
    );

    /**
     * What a TRX transfer to a never-activated address burns: the account
     * creation fee plus the creation bandwidth fee, which free bandwidth
     * cannot cover.
     */
    public getAccountCreationFeeSun = async (): Promise<BigNumber> => {
        const getValue = await this.getChainParameters();
        const creationFee = getValue('getCreateNewAccountFeeInSystemContract') ?? 1_000_000;
        const creationBandwidthFee = getValue('getCreateAccountFee') ?? 100_000;
        return new BigNumber(creationFee).plus(creationBandwidthFee);
    };

    public getResourcePrices = decorateApi(
        async (): Promise<TronResourcePrices> => {
            const getValue = await this.getChainParameters();

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
                joinUrl(this.tronGridBaseUrl, `/v1/accounts/${address}/transactions/trc20`)
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

            const httpRes = await tronFetch(url, {
                method: 'GET',
                headers: this.headers
            });
            const response = await httpRes.json();

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
                    fee: item.isFreePro
                        ? {
                              type: 'free-transfer'
                          }
                        : item.feeType === 'ton' && item.feeTonNano
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
