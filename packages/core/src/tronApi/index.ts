import BigNumber from 'bignumber.js';
import { TRON_USDT_ASSET } from '../entries/crypto/asset/constants';
import { TronWeb } from 'tronweb';
import { TronAsset } from '../entries/crypto/asset/tron-asset';
import { AssetAmount } from '../entries/crypto/asset/asset-amount';
import { notNullish } from '../utils/types';

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
};
export type TronHistoryItem = TronHistoryItemTransferAsset;

export class TronApi {
    public readonly baseURL: string;

    public get headers() {
        return {
            ...(this.apiKey && {
                'TRON-PRO-API-KEY': this.apiKey
            }),
            'Content-Type': 'application/json'
        };
    }

    constructor(baseURL: string, private readonly apiKey?: string) {
        this.baseURL = removeTrailingSlash(baseURL);
    }

    async getBalances(address: string) {
        const res = await (
            await fetch(`${this.baseURL}/v1/accounts/${address}`, {
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

    async estimateEnergy(params: {
        from: string;
        contractAddress: string;
        selector: string;
        data: string;
    }) {
        try {
            const response = await (
                await fetch(`${this.baseURL}/wallet/triggerconstantcontract`, {
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

            return energy;
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
            const contract = new TronWeb({ fullHost: this.baseURL }).contract(
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
                await fetch(`${this.baseURL}/jsonrpc`, {
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
        }
    ): Promise<TronHistoryItem[]> {
        const url = new URL(`${this.baseURL}/v1/accounts/${address}/transactions/trc20`);

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

                const isScam = assetAmount.relativeAmount.lt(1);

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
                    isFailed: false // TODO
                } satisfies TronHistoryItemTransferAsset;
            })
            .filter(notNullish);
    }
}
