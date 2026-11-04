import { expect, test } from '../../../../../playwright/test';
import { MultichainAssetAbout } from './MultichainAssetAbout';

// Behaviour targets:
//   - short text that fits the 3-line clamp shows no "More" link;
//   - long text shows "More", and expanding reveals the full text and
//     drops the link.

const FRAME = 'w-[390px] bg-backgroundPage';

const LONG_TEXT =
    'GRAM is a sharded L1 blockchain with sub-second finality and Telegram integration. ' +
    'It supports smart contracts, decentralized applications and cross-chain bridges, ' +
    'and its validator set secures the network through proof of stake. The token powers ' +
    'gas fees, staking rewards and on-chain governance across the whole ecosystem.';

test('MultichainAssetAbout short text renders without More', async ({ mount }) => {
    const c = await mount(
        <div className={FRAME}>
            <MultichainAssetAbout about={{ enabled: true, text: 'Telegram Duck' }} />
        </div>
    );
    await expect(c.getByText('Telegram Duck')).toBeVisible();
    await expect(c.getByRole('button', { name: 'More' })).not.toBeVisible();
});

test('MultichainAssetAbout long text clamps and expands via More', async ({ mount }) => {
    const c = await mount(
        <div className={FRAME}>
            <MultichainAssetAbout about={{ enabled: true, text: LONG_TEXT }} />
        </div>
    );
    const more = c.getByRole('button', { name: 'More' });
    await expect(more).toBeVisible();
    await more.click();
    await expect(more).not.toBeVisible();
    await expect(c.getByText(/on-chain governance across the whole ecosystem/)).toBeVisible();
});
