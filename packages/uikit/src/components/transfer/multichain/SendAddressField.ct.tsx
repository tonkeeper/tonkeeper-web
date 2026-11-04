import { expect, screenshot, test } from '../../../../playwright/test';
import { SendAddressField } from './SendAddressField';

const noop = () => {};
const FRAME = 'w-[390px] bg-backgroundPage p-4';

const TON_ADDRESS = 'EQDtR_gykQ0K0W11a0I51m8G_aIC_epBTaLMO7L9aQPfOwzo';

// One screenshot per state — the field fills its container and has no
// breakpoint-dependent layout, so desktop and mobile render identically (hence
// `screenshot`, not `screenshotEachMode`). The states that differ visually:
// empty offers Paste + Scan; filled swaps to a Clear button; an error paints the
// border red and shows a message below. Scan is only present on the native shell
// (`onScan` provided).
screenshot('SendAddressField empty', () => (
    <div className={FRAME}>
        <SendAddressField value="" onChange={noop} onClear={noop} onPaste={noop} onScan={noop} />
    </div>
));

screenshot('SendAddressField empty without scan', () => (
    <div className={FRAME}>
        <SendAddressField value="" onChange={noop} onClear={noop} onPaste={noop} />
    </div>
));

screenshot('SendAddressField filled', () => (
    <div className={FRAME}>
        <SendAddressField value={TON_ADDRESS} onChange={noop} onClear={noop} onPaste={noop} />
    </div>
));

screenshot('SendAddressField error', () => (
    <div className={FRAME}>
        <SendAddressField
            value="0x00000000219ab540356cBB839Cbe05303d7705F1"
            onChange={noop}
            onClear={noop}
            onPaste={noop}
            error="Invalid address format for the selected network. Use a TON address."
        />
    </div>
));

test('SendAddressField shows Paste + Scan while empty', async ({ mount }) => {
    const c = await mount(
        <SendAddressField value="" onChange={noop} onClear={noop} onPaste={noop} onScan={noop} />
    );
    await expect(c.getByText('Paste')).toBeVisible();
    await expect(c.getByRole('button', { name: 'Scan QR code' })).toBeVisible();
    await expect(c.getByRole('button', { name: 'Clear' })).toHaveCount(0);
});

test('SendAddressField hides Scan when no onScan handler is provided', async ({ mount }) => {
    const c = await mount(
        <SendAddressField value="" onChange={noop} onClear={noop} onPaste={noop} />
    );
    await expect(c.getByText('Paste')).toBeVisible();
    await expect(c.getByRole('button', { name: 'Scan QR code' })).toHaveCount(0);
});

test('SendAddressField swaps to Clear once filled, and clearing fires onClear', async ({
    mount
}) => {
    let cleared = 0;
    const c = await mount(
        <SendAddressField
            value={TON_ADDRESS}
            onChange={noop}
            onClear={() => (cleared += 1)}
            onPaste={noop}
            onScan={noop}
        />
    );
    await expect(c.getByText('Paste')).toHaveCount(0);
    const clear = c.getByRole('button', { name: 'Clear' });
    await expect(clear).toBeVisible();
    await clear.click();
    expect(cleared).toBe(1);
});
