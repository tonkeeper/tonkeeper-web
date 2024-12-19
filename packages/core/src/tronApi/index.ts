import BigNumber from 'bignumber.js';

const removeTrailingSlash = (str: string) => str.replace(/\/$/, '');

export class TronApi {
    private readonly baseURL: string;

    constructor(baseURL: string, private readonly apiKey?: string) {
        this.baseURL = removeTrailingSlash(baseURL);
    }

    async getBalances(address: string) {
        const res = await (
            await fetch(`${this.baseURL}/v1/accounts/${address}`, {
                headers: {
                    ...(this.apiKey && {
                        'TRON-PRO-API-KEY': this.apiKey
                    }),
                    'Content-Type': 'application/json'
                }
            })
        ).json();

        if (!res?.success || !res?.data) {
            throw new Error('Fetch tron balances failed');
        }

        const info = res?.data?.[0];
        if (!info) {
            return {
                trx: '0',
                usdt: '0'
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
                (obj: Record<string, string>) => 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' in obj
            )?.TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t;

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
}
