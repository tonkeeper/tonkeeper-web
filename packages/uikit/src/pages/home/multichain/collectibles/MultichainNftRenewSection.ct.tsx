import { expect, screenshot, screenshotEachMode, test } from '../../../../../playwright/test';
import { Button } from '../../../../primitives';
import { NftRenewConfirmView, NftRenewSectionView } from './MultichainNftRenewSection';

const noop = () => {};

screenshotEachMode('NftRenewSectionView', () => (
    <NftRenewSectionView renewUntilFormatted="August 1, 2027" daysLeft={220} onRenew={noop} />
));

screenshot(
    'NftRenewSectionView expiring soon',
    () => <NftRenewSectionView renewUntilFormatted="August 1, 2027" daysLeft={12} onRenew={noop} />,
    'desktop'
);

screenshot(
    'NftRenewSectionView renew in progress',
    () => (
        <NftRenewSectionView
            renewUntilFormatted="August 1, 2027"
            daysLeft={220}
            inProgress
            onRenew={noop}
        />
    ),
    'desktop'
);

screenshotEachMode('NftRenewConfirmView', () => (
    <NftRenewConfirmView
        domain="alice.ton"
        accountEmoji="🐳"
        accountName="Main wallet"
        amount="0.02 GRAM"
        amountFiat="$ 0.06"
        fee="≈ 0.0031 GRAM"
        feeSub="≈ $ 0.01"
        action={
            <Button variant="primaryBlue" size="large" fullWidth>
                Renew Domain
            </Button>
        }
    />
));

test('renew button fires onRenew', async ({ mount }) => {
    let fired = false;
    const c = await mount(
        <NftRenewSectionView
            renewUntilFormatted="August 1, 2027"
            daysLeft={220}
            onRenew={() => {
                fired = true;
            }}
        />
    );
    await c.getByRole('button', { name: /Renew until/ }).click();
    expect(fired).toBe(true);
});

test('in-progress state disables the button and swaps the label', async ({ mount }) => {
    const c = await mount(
        <NftRenewSectionView
            renewUntilFormatted="August 1, 2027"
            daysLeft={220}
            inProgress
            onRenew={noop}
        />
    );
    const button = c.getByRole('button', { name: /renew in progress/i });
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
});

test('caption reads Expires in N days', async ({ mount }) => {
    const c = await mount(
        <NftRenewSectionView renewUntilFormatted="August 1, 2027" daysLeft={220} onRenew={noop} />
    );
    await expect(c.getByText('Expires in 220 days')).toBeVisible();
});
