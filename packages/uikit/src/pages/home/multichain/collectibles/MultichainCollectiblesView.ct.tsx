import { NFT } from '@tonkeeper/core/dist/entries/nft';

import { expect, screenshot, test } from '../../../../../playwright/test';
import { MultichainCollectiblesView } from './MultichainCollectiblesView';

const noop = () => {};

const PREVIEW = (fill: string) =>
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="${fill}"/></svg>`
    );

const FILLS = ['#7665E5', '#2FA8A0', '#C85CF0', '#E5A056', '#5680E5'];

const sampleNfts = (count: number): NFT[] =>
    Array.from(
        { length: count },
        (_, i) =>
            ({
                address: `0:${String(i).padStart(2, '0').repeat(32)}`,
                previews: [{ resolution: '500x500', url: PREVIEW(FILLS[i % FILLS.length]) }],
                metadata: { name: `Plush Pepe #${i + 1}` },
                collection: { address: '0:' + 'b2'.repeat(32), name: 'Telegram Usernames' },
                trust: 'whitelist'
            } as unknown as NFT)
    );

screenshot('MultichainCollectiblesView mobile grid', () => (
    <div className="w-[390px]">
        <MultichainCollectiblesView
            nfts={sampleNfts(5)}
            onBack={noop}
            onOpenNft={noop}
            onOpenSettings={noop}
        />
    </div>
));

screenshot('MultichainCollectiblesView compact grid', () => (
    <div className="w-[520px]">
        <MultichainCollectiblesView
            compact
            nfts={sampleNfts(6)}
            onBack={noop}
            onOpenNft={noop}
            onOpenSettings={noop}
        />
    </div>
));

screenshot('MultichainCollectiblesView empty', () => (
    <div className="w-[390px]">
        <MultichainCollectiblesView
            nfts={[]}
            onBack={noop}
            onOpenNft={noop}
            onOpenSettings={noop}
        />
    </div>
));

screenshot('MultichainCollectiblesView loading', () => (
    <div className="w-[390px]">
        <MultichainCollectiblesView
            nfts={undefined}
            onBack={noop}
            onOpenNft={noop}
            onOpenSettings={noop}
        />
    </div>
));

screenshot('MultichainCollectiblesView error', () => (
    <div className="w-[390px]">
        <MultichainCollectiblesView
            nfts={undefined}
            isError
            onRetry={noop}
            onBack={noop}
            onOpenNft={noop}
            onOpenSettings={noop}
        />
    </div>
));

test('a failed list offers a retry instead of the skeleton', async ({ mount }) => {
    let retried = 0;
    const c = await mount(
        <MultichainCollectiblesView
            nfts={undefined}
            isError
            onRetry={() => (retried += 1)}
            onBack={noop}
            onOpenNft={noop}
            onOpenSettings={noop}
        />
    );
    await c.getByRole('button', { name: 'Retry' }).click();
    expect(retried).toBe(1);
});

test('clicking a card opens that NFT', async ({ mount }) => {
    const nfts = sampleNfts(3);
    let opened: NFT | undefined;
    const c = await mount(
        <MultichainCollectiblesView
            nfts={nfts}
            onBack={noop}
            onOpenNft={nft => (opened = nft)}
            onOpenSettings={noop}
        />
    );
    await c.getByText('Plush Pepe #2').click();
    expect(opened?.address).toBe(nfts[1].address);
});

test('subtitle info opens the TON-only explainer sheet and OK closes it', async ({
    mount,
    page
}) => {
    const c = await mount(
        <MultichainCollectiblesView
            nfts={sampleNfts(1)}
            onBack={noop}
            onOpenNft={noop}
            onOpenSettings={noop}
        />
    );
    await c.getByText('Only TON collectibles for now').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Only TON collectibles are supported for now')).toBeVisible();
    await dialog.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('header buttons call back and settings', async ({ mount }) => {
    let backs = 0;
    let settings = 0;
    const c = await mount(
        <MultichainCollectiblesView
            nfts={sampleNfts(1)}
            onBack={() => (backs += 1)}
            onOpenNft={noop}
            onOpenSettings={() => (settings += 1)}
        />
    );
    await c.getByRole('button', { name: 'Back' }).click();
    await c.getByRole('button', { name: 'Collectibles', exact: true }).click();
    expect(backs).toBe(1);
    expect(settings).toBe(1);
});
