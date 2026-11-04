import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import {
    BatteryHistorySheetHarness,
    BatteryPurchaseDetailsHarness
} from './BatteryHistorySheetHarness';

// The charges history nested in the Battery sheet, plus the details sheet
// a row opens. Both render in a portal, so the dialog is the screenshot
// target; the fixtures cover a refundable recharge, a gift, a refund in
// flight and a settled refund.

screenshotEachMode(
    'BatteryHistorySheet list',
    () => <BatteryHistorySheetHarness />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

screenshotEachMode(
    'BatteryHistorySheet loading',
    () => <BatteryHistorySheetHarness state="loading" />,
    ['desktop'],
    { target: 'dialog' }
);

screenshotEachMode(
    'BatteryHistorySheet empty',
    () => <BatteryHistorySheetHarness state="empty" />,
    ['desktop'],
    { target: 'dialog' }
);

screenshotEachMode(
    'BatteryHistorySheet error',
    () => <BatteryHistorySheetHarness state="error" />,
    ['desktop'],
    { target: 'dialog' }
);

screenshotEachMode(
    'BatteryPurchaseDetails refundable',
    () => <BatteryPurchaseDetailsHarness purchaseId={4} />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

screenshotEachMode(
    'BatteryPurchaseDetails refunded notice',
    () => <BatteryPurchaseDetailsHarness purchaseId={4} refunded />,
    ['desktop'],
    { target: 'dialog' }
);

test('rows show the recharge state, source and paid amount', async ({ mount, page }) => {
    await mount(<BatteryHistorySheetHarness />);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('250 charges');
    await expect(dialog).toContainText('1.5 GRAM');
    await expect(dialog).toContainText('For 0:8a1f…e7f8');
    await expect(dialog).toContainText('5.2 USDT');
    await expect(dialog).toContainText('Refund pending');
    await expect(dialog).toContainText('Refunded');
});

test('a row opens its purchase', async ({ mount, page }) => {
    const selected: number[] = [];
    await mount(<BatteryHistorySheetHarness onSelect={purchase => selected.push(purchase.id)} />);
    await page
        .getByRole('dialog')
        .getByRole('button', { name: /For 0:8a1f/ })
        .click();
    expect(selected).toEqual([3]);
});

test('an empty history explains what will show up', async ({ mount, page }) => {
    await mount(<BatteryHistorySheetHarness state="empty" />);
    await expect(page.getByRole('dialog')).toContainText('Your charges history will appear here');
});

test('a failed load offers a retry instead of the list', async ({ mount, page }) => {
    let retries = 0;
    await mount(<BatteryHistorySheetHarness state="error" onRetry={() => retries++} />);
    const dialog = page.getByRole('dialog');
    await expect(dialog).not.toContainText('Refill');
    await dialog.getByRole('button', { name: 'Retry' }).click();
    expect(retries).toBe(1);
});

test('a refundable purchase offers to return its charges', async ({ mount, page }) => {
    let refunds = 0;
    await mount(<BatteryPurchaseDetailsHarness purchaseId={4} onRefund={() => refunds++} />);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Available for refund');
    await expect(dialog).toContainText('decrease by 250 charges');
    await dialog.getByRole('button', { name: 'Return charges' }).click();
    expect(refunds).toBe(1);
});

test('a refund in flight hides the action', async ({ mount, page }) => {
    await mount(<BatteryPurchaseDetailsHarness purchaseId={2} />);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Promo code');
    await expect(dialog).not.toContainText('Available for refund');
    await expect(dialog.getByRole('button', { name: 'Return charges' })).toHaveCount(0);
});

test('a settled refund shows what came back', async ({ mount, page }) => {
    await mount(<BatteryPurchaseDetailsHarness purchaseId={1} />);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Returned');
    await expect(dialog).toContainText('2.4 GRAM');
    await expect(dialog.getByRole('button', { name: 'Return charges' })).toHaveCount(0);
});

test('after the request the sheet reports the refunded amount', async ({ mount, page }) => {
    await mount(<BatteryPurchaseDetailsHarness purchaseId={4} refunded />);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('1.5 GRAM will be refunded');
    await expect(dialog.getByRole('button', { name: 'Ok' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Return charges' })).toHaveCount(0);
});
