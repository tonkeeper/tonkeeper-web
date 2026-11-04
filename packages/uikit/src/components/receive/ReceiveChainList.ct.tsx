import { expect, screenshot, test } from '../../../playwright/test';
import { ReceiveChainList } from './ReceiveChainList';

// Edge cases the screenshot suite targets:
//   - one row per RECEIVE_CHAINS entry, with the active multichain
//     account's per-chain address (EVM L1/L2 rows — Ethereum / Base / BNB Smart Chain
//     / Arbitrum — all share the single EVM address);
//   - each row shows the chain icon, display name, shortened address, a QR
//     glyph, and a separate copy button;
//   - rows are divider-separated inside the rounded card.
// The empty state (`receive_no_wallets`) requires a non-multichain active
// account, which the component-test harness doesn't seed — it's covered by
// the account-model unit tests instead.

const CARD = 'w-[420px]';

screenshot('ReceiveChainList all chains', () => (
    <div className={CARD}>
        <ReceiveChainList onSelect={() => {}} />
    </div>
));

test('ReceiveChainList row tap fires onSelect with the chain and address', async ({ mount }) => {
    let selectedChainId: string | undefined;
    let selectedAddress: string | undefined;
    const c = await mount(
        <div className={CARD}>
            <ReceiveChainList
                onSelect={(chain, address) => {
                    selectedChainId = chain.id;
                    selectedAddress = address;
                }}
            />
        </div>
    );
    await c.getByRole('button', { name: /Ethereum/ }).click();
    expect(selectedChainId).toBe('eth');
    expect(selectedAddress).toBeTruthy();
});

test('ReceiveChainList renders a row per receive chain', async ({ mount }) => {
    const c = await mount(
        <div className={CARD}>
            <ReceiveChainList onSelect={() => {}} />
        </div>
    );
    // TON, Tron, Ethereum, Bitcoin, Base, BNB Smart Chain, Arbitrum.
    await expect(c.getByText('Ethereum')).toBeVisible();
    await expect(c.getByText('Bitcoin')).toBeVisible();
    await expect(c.getByText('Tron')).toBeVisible();
});
