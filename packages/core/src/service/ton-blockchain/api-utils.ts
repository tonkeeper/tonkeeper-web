import { APIConfig } from '../../entries/apis';
import { Account, AccountsApi } from '../../tonApiV2';
import { Address } from '@ton/core';

export async function fetchAccountBatched(api: APIConfig, address: string) {
    return new Promise<Account>(resolve => {
        addAccountToFetchBatch(api, address, resolve);
    });
}

let batchedAccountsFetcher: BatchedAccountsFetcher | undefined;
function addAccountToFetchBatch(
    api: APIConfig,
    address: string,
    callback: (account: Account) => void
) {
    if (batchedAccountsFetcher?.isFlushed) {
        batchedAccountsFetcher = undefined;
    }

    if (!batchedAccountsFetcher) {
        batchedAccountsFetcher = new BatchedAccountsFetcher(api);
    }

    batchedAccountsFetcher.addAccount(address, callback);
}

class BatchedAccountsFetcher {
    private accountsFetchRequest: { address: string; callback: (account: Account) => void }[] = [];

    public isFlushed = false;

    private timeout: ReturnType<typeof setTimeout> | undefined;

    constructor(private readonly api: APIConfig) {}

    addAccount(address: string, callback: (account: Account) => void) {
        if (this.isFlushed) {
            throw new Error('Flushed');
        }

        this.accountsFetchRequest.push({
            address,
            callback
        });

        if (this.accountsFetchRequest.length === 1) {
            this.timeout = setTimeout(() => this.flush(), 100);
        } else if (this.accountsFetchRequest.length === 100) {
            clearTimeout(this.timeout);
            this.flush();
        }
    }

    private async flush() {
        if (this.isFlushed) {
            return;
        }

        this.isFlushed = true;

        const response = await new AccountsApi(this.api.tonApiV2).getAccounts({
            getAccountsRequest: {
                accountIds: this.accountsFetchRequest.map(item =>
                    Address.parse(item.address).toRawString()
                )
            }
        });

        this.accountsFetchRequest.forEach(item => {
            item.callback(
                response.accounts.find(
                    (account: Account) =>
                        account.address === Address.parse(item.address).toRawString()
                )!
            );
        });
    }
}
