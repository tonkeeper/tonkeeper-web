import { CurrencyPickerScreen } from './CurrencyPickerScreen';
import { expect, screenshotEachMode, test } from '../../../playwright/test';

// CurrencyPickerScreen is a Modal-based picker. The master currency list
// comes from `useSupportedCurrencies()` (react-query, backed by
// `tonendpoint.supportedCurrencies()`), which has no real endpoint in the CT
// harness — the query stays empty, so the body falls back to the no-results
// state. That's still a faithful mount: search field, the empty-state copy,
// the back arrow (registered via `useSetModalOnBack`), and the close button.
//
// Edge cases the suite targets:
//   - open modal with an `allowed` list but an empty master list → renders
//     the no-results body rather than a row list.
//   - the search field is interactive and drives the (memoised) filter.
//   - back arrow fires `onBack`; close button fires `onClose`.

const noop = () => {};

screenshotEachMode(
    'CurrencyPickerScreen open no-results',
    () => (
        <CurrencyPickerScreen
            isOpen
            onClose={noop}
            onBack={noop}
            allowed={['USD', 'EUR', 'GBP']}
            selected="USD"
            onSelect={noop}
        />
    ),
    undefined,
    { target: 'dialog' }
);

test('CurrencyPickerScreen mounts the dialog with a search field', async ({ mount, page }) => {
    await mount(
        <CurrencyPickerScreen
            isOpen
            onClose={noop}
            onBack={noop}
            allowed={['USD', 'EUR', 'GBP']}
            selected="USD"
            onSelect={noop}
        />
    );
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('searchbox')).toBeVisible();
});

test('CurrencyPickerScreen search field accepts typed input', async ({ mount, page }) => {
    await mount(
        <CurrencyPickerScreen
            isOpen
            onClose={noop}
            onBack={noop}
            allowed={['USD', 'EUR', 'GBP']}
            selected="USD"
            onSelect={noop}
        />
    );
    const search = page.getByRole('dialog').getByRole('searchbox');
    await search.fill('eur');
    await expect(search).toHaveValue('eur');
});

test('CurrencyPickerScreen back arrow fires onBack', async ({ mount, page }) => {
    let backs = 0;
    await mount(
        <CurrencyPickerScreen
            isOpen
            onClose={noop}
            onBack={() => backs++}
            allowed={['USD', 'EUR', 'GBP']}
            selected="USD"
            onSelect={noop}
        />
    );
    await page.getByRole('button', { name: 'Back' }).click();
    expect(backs).toBe(1);
});

test('CurrencyPickerScreen close button fires onClose', async ({ mount, page }) => {
    let closes = 0;
    await mount(
        <CurrencyPickerScreen
            isOpen
            onClose={() => closes++}
            onBack={noop}
            allowed={['USD', 'EUR', 'GBP']}
            selected="USD"
            onSelect={noop}
        />
    );
    await page.getByRole('button', { name: 'Close' }).click();
    expect(closes).toBe(1);
});
