import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';

import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { BatteryModalHarness } from './BatteryModalHarness';

// The sheet is the multichain Battery screen. Screenshots cover the three
// glyph states the header can take (charged, empty, refunded-negative) plus
// the masked loading state; the modal renders in a portal, so the dialog is
// the screenshot target.

screenshotEachMode(
    'BatteryModal charged',
    () => <BatteryModalHarness tonBalance="2.1" charges={807} />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

screenshotEachMode(
    'BatteryModal empty',
    () => <BatteryModalHarness tonBalance="0" charges={0} />,
    ['desktop'],
    { target: 'dialog' }
);

screenshotEachMode(
    'BatteryModal negative balance',
    () => <BatteryModalHarness tonBalance="-0.33" charges={-126} />,
    ['desktop'],
    { target: 'dialog' }
);

screenshotEachMode('BatteryModal loading', () => <BatteryModalHarness loading />, ['desktop'], {
    target: 'dialog'
});

screenshotEachMode(
    'BatteryModal promo code rejected',
    () => (
        <BatteryModalHarness
            tonBalance="0.5"
            charges={190}
            promoError="The entered code is not valid"
        />
    ),
    ['desktop'],
    { target: 'dialog' }
);

test('shows the charge count for a charged battery', async ({ mount, page }) => {
    await mount(<BatteryModalHarness tonBalance="2.1" charges={807} />);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('807 charges');
    await expect(dialog).not.toContainText('ran out');
});

test('explains a negative balance in red under the charge count', async ({ mount, page }) => {
    await mount(<BatteryModalHarness tonBalance="-0.33" charges={-126} />);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('-126 charges');
    await expect(dialog).toContainText('refunded purchases');
});

test('settings, recharge method and gift rows fire their callbacks', async ({ mount, page }) => {
    let settings = 0;
    const selected: string[] = [];
    let gift = 0;
    await mount(
        <BatteryModalHarness
            tonBalance="2.1"
            charges={807}
            onOpenSettings={() => settings++}
            onSelectMethod={id => selected.push(id)}
            onSelectGift={() => gift++}
        />
    );
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /Battery Settings/ }).click();
    await dialog.getByRole('button', { name: /Recharge with USD₮/ }).click();
    await dialog.getByRole('button', { name: /Recharge with GRAM/ }).click();
    await dialog.getByRole('button', { name: /Battery Gift/ }).click();
    expect(settings).toBe(1);
    expect(selected).toEqual(['ton-usdt', TON_ASSET.id]);
    expect(gift).toBe(1);
});

test('an empty battery links to the supported transactions instead of the settings', async ({
    mount,
    page
}) => {
    let opened = 0;
    await mount(
        <BatteryModalHarness
            tonBalance="0"
            charges={0}
            onOpenSupportedTransactions={() => opened++}
        />
    );
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: /Battery Settings/ })).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Supported transactions' }).click();
    expect(opened).toBe(1);
});

test('a charged battery shows the settings row instead of the supported transactions link', async ({
    mount,
    page
}) => {
    await mount(<BatteryModalHarness tonBalance="2.1" charges={807} />);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: 'Supported transactions' })).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: /Battery Settings/ })).toContainText(
        'EVM networks'
    );
});

test('the charges history row opens the history', async ({ mount, page }) => {
    let opened = 0;
    await mount(
        <BatteryModalHarness tonBalance="2.1" charges={807} onOpenHistory={() => opened++} />
    );
    const dialog = page.getByRole('dialog');
    const row = dialog.getByRole('button', { name: /Charges History/ });
    await expect(row).toContainText('Recharges and refunds');
    await row.click();
    expect(opened).toBe(1);
});

test('hides the gift row and promo field when purchases are unavailable', async ({
    mount,
    page
}) => {
    await mount(
        <BatteryModalHarness tonBalance="2.1" charges={807} withGift={false} withPromo={false} />
    );
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: /Battery Gift/ })).toHaveCount(0);
    await expect(dialog.getByPlaceholder('Promo Code')).toHaveCount(0);
});

test('an empty promo field offers Paste', async ({ mount, page }) => {
    await mount(<BatteryModalHarness tonBalance="0" charges={0} />);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: 'Paste' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Apply' })).toHaveCount(0);
});

test('a filled promo field offers Apply and submits on Enter or click', async ({ mount, page }) => {
    let submitted = 0;
    // The harness owns the value: a rejected-code mount stands in for typed text.
    await mount(
        <BatteryModalHarness
            tonBalance="0"
            charges={0}
            promoError="The entered code is not valid"
            onSubmitPromo={() => submitted++}
        />
    );
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('The entered code is not valid');
    await dialog.getByPlaceholder('Promo Code').press('Enter');
    await dialog.getByRole('button', { name: 'Apply' }).click();
    expect(submitted).toBe(2);
});
