/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it, vi } from 'vitest';

// Neutralize ESM-resolution failures from sub-modules pulled in transitively
// by accountsStorage. The stubs under test never call into either module.
vi.mock('@ton-keychain/core', () => ({}));
vi.mock('@ton-keychain/trx', () => ({}));

import { IAppSdk } from '../../../../AppSdk';
import { resolve } from '../../registry';
// Side effect: registers every strategy (TON + multichain stubs).
import '../../factory';

const stubSdk = {} as IAppSdk;

describe('multichain non-TON signer stubs', () => {
    it.each(['evm', 'btc', 'tron', 'sol'] as const)(
        'multichain × %s throws a not-implemented error',
        async chain => {
            await expect(
                resolve({
                    sdk: stubSdk,
                    accountId: 'acc:test',
                    chain,
                    accountType: 'multichain'
                })
            ).rejects.toThrow(`Multichain ${chain} signing is not implemented`);
        }
    );
});
