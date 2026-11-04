/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { Network } from '../../../../entries/network';
import { WalletVersion } from '../../../../entries/wallet';
import { getStrategy } from '../index';
import type { TonWalletContractArgs, TonWalletContract } from '../ton-strategy';

const FIXTURE_PUBLIC_KEY_HEX = '5b1d70e6ccb39d10a5fb4d05dbbafcd99c8e3b04ee15bb1cc4fd58a3f8b15a87';

describe('wallet contract strategy registry', () => {
    it('returns the TON strategy that produces a usable contract', () => {
        const strategy = getStrategy<TonWalletContractArgs, TonWalletContract>('ton');
        expect(strategy.chain).toBe('ton');
        const contract = strategy.create({
            publicKey: FIXTURE_PUBLIC_KEY_HEX,
            version: WalletVersion.V4R2,
            network: Network.MAINNET
        });
        expect(contract.address).toBeDefined();
        expect(contract.init).toBeDefined();
    });

    it.each(['evm', 'btc', 'tron', 'sol'] as const)(
        'throws a clear not-registered error for unregistered chain %s',
        chain => {
            expect(() => getStrategy(chain)).toThrow(/not registered/);
            expect(() => getStrategy(chain)).toThrow(new RegExp(`"${chain}"`));
        }
    );
});
