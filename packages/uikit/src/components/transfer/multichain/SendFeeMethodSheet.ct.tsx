import { expect, screenshotEachMode, test } from '../../../../playwright/test';
import IcBatteryFlash44 from '../../../icons/components/IcBatteryFlash44';
import { FeeMethodBatteryIcon, SendFeeMethodSheet } from './SendFeeMethodSheet';

const noop = () => {};

const disc = (className: string) => <div className={`size-11 rounded-full ${className}`} />;

const options = [
    {
        key: 'external',
        icon: disc('bg-accentBlue'),
        title: 'TON',
        subtitle: '≈ $0.00154 (0.00115 TON)'
    },
    {
        key: 'battery',
        icon: (
            <FeeMethodBatteryIcon>
                <IcBatteryFlash44 />
            </FeeMethodBatteryIcon>
        ),
        title: 'Keeper Battery',
        subtitle: '≈ $0.00696 (2 charges)'
    },
    {
        key: 'gasless',
        icon: disc('bg-accentGreen'),
        title: 'USD₮',
        subtitle: '≈ 0.00571 USD₮'
    }
];

screenshotEachMode(
    'Send fee method sheet',
    () => (
        <SendFeeMethodSheet
            isOpen
            options={options}
            selected="battery"
            onSelect={noop}
            onClose={noop}
        />
    ),
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

screenshotEachMode(
    'Send fee method sheet with unaffordable method',
    () => (
        <SendFeeMethodSheet
            isOpen
            options={options.map(o => (o.key === 'battery' ? { ...o, disabled: true } : o))}
            selected="external"
            onSelect={noop}
            onClose={noop}
        />
    ),
    ['desktop'],
    { target: 'dialog' }
);

test('picking a method reports it and closes', async ({ mount, page }) => {
    let selected = '';
    let closed = false;
    await mount(
        <SendFeeMethodSheet
            isOpen
            options={options}
            selected="external"
            onSelect={key => (selected = key)}
            onClose={() => (closed = true)}
        />
    );
    await page.getByRole('dialog').getByRole('button', { name: /USD₮/ }).click();
    expect(selected).toBe('gasless');
    expect(closed).toBe(true);
});

test('an unaffordable method with a top-up runs it instead of selecting', async ({
    mount,
    page
}) => {
    let selected = '';
    let recharged = 0;
    let closed = false;
    await mount(
        <SendFeeMethodSheet
            isOpen
            options={options.map(o =>
                o.key === 'battery'
                    ? {
                          ...o,
                          disabled: true,
                          action: { label: 'Recharge', onClick: () => (recharged += 1) }
                      }
                    : o
            )}
            selected="external"
            onSelect={key => (selected = key)}
            onClose={() => (closed = true)}
        />
    );
    const row = page.getByRole('dialog').getByRole('button', { name: /Keeper Battery/ });
    await expect(row).toContainText('Recharge');
    await row.click();
    expect(recharged).toBe(1);
    expect(selected).toBe('');
    expect(closed).toBe(true);
});

test('an unaffordable method cannot be picked', async ({ mount, page }) => {
    let selected = '';
    await mount(
        <SendFeeMethodSheet
            isOpen
            options={options.map(o => (o.key === 'battery' ? { ...o, disabled: true } : o))}
            selected="external"
            onSelect={key => (selected = key)}
            onClose={noop}
        />
    );
    await expect(
        page.getByRole('dialog').getByRole('button', { name: /Keeper Battery/ })
    ).toBeDisabled();
    expect(selected).toBe('');
});
