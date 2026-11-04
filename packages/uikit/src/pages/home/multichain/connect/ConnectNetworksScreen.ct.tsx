import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { ConnectNetworksScreenHarness } from './ConnectNetworksScreenHarness';

// One row per granted network with the account's address on that chain;
// EVM networks share the single EVM address.
screenshotEachMode(
    'ConnectNetworksScreen',
    () => (
        <div className="w-[358px]">
            <ConnectNetworksScreenHarness
                evmAddress="0x9858EfFD232B4033E47d90003D41EC34EcaEda94"
                tronAddress="TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH"
                networks={['eth', 'base', 'arb', 'bsc', 'tron']}
            />
        </div>
    ),
    ['desktop', 'mobile']
);

test('orders a requested network subset consistently', async ({ mount }) => {
    const c = await mount(
        <div className="w-[358px]">
            <ConnectNetworksScreenHarness
                evmAddress="0x9858EfFD232B4033E47d90003D41EC34EcaEda94"
                tronAddress="TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH"
                networks={['arb', 'eth', 'tron', 'bsc', 'base']}
            />
        </div>
    );

    expect(
        await c.getByText(/^(Tron|Ethereum|Base|BNB Smart Chain|Arbitrum)$/).allTextContents()
    ).toEqual(['Tron', 'Ethereum', 'Base', 'BNB Smart Chain', 'Arbitrum']);
});
