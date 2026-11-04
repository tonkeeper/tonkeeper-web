import { expect, screenshot, test } from '../../../../../playwright/test';
import { CryptoCatalogHeader } from './CryptoCatalogHeader';

// Edge cases the screenshot suite targets:
//   - centred title (`wallet_crypto_section`) sits in the middle while the
//     close / back buttons are absolutely pinned to the edges — title
//     centring must not shift when a button is present.
//   - fixed 64px header height; secondary-background close affordance vs
//     the plain back chevron of the routed-page variant.

const CARD = 'w-[360px] overflow-hidden rounded-medium bg-backgroundContent';

screenshot('CryptoCatalogHeader default', () => (
    <div className={CARD}>
        <CryptoCatalogHeader onClose={() => {}} />
    </div>
));

screenshot('CryptoCatalogHeader back variant', () => (
    <div className={CARD}>
        <CryptoCatalogHeader onBack={() => {}} />
    </div>
));

test('CryptoCatalogHeader close button fires onClose', async ({ mount }) => {
    let closed = 0;
    const c = await mount(
        <div className={CARD}>
            <CryptoCatalogHeader onClose={() => closed++} />
        </div>
    );
    await c.getByRole('button').click();
    expect(closed).toBe(1);
});

test('CryptoCatalogHeader back button fires onBack', async ({ mount }) => {
    let backs = 0;
    const c = await mount(
        <div className={CARD}>
            <CryptoCatalogHeader onBack={() => backs++} />
        </div>
    );
    await c.getByRole('button').click();
    expect(backs).toBe(1);
});
