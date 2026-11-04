import { expect, screenshot, test } from '../../playwright/test';
import { NumPad } from './NumPad';

// Edge cases the screenshot suite targets:
//   - the 3×4 grid of 72px keys with the empty bottom-left slot;
//   - backspace keeps its slot but is hidden while there is nothing to delete.

const STAGE = 'w-[390px] bg-backgroundPage';

screenshot('NumPad', () => (
    <div className={STAGE}>
        <NumPad onDigit={() => {}} onDelete={() => {}} canDelete />
    </div>
));

screenshot('NumPad without backspace', () => (
    <div className={STAGE}>
        <NumPad onDigit={() => {}} onDelete={() => {}} canDelete={false} />
    </div>
));

test('NumPad reports digits and backspace', async ({ mount }) => {
    const digits: string[] = [];
    let deletes = 0;
    const c = await mount(
        <div className={STAGE}>
            <NumPad onDigit={d => digits.push(d)} onDelete={() => deletes++} canDelete />
        </div>
    );
    await c.getByRole('button', { name: '7', exact: true }).click();
    await c.getByRole('button', { name: '0', exact: true }).click();
    await c.getByRole('button', { name: 'Delete' }).click();
    expect(digits).toEqual(['7', '0']);
    expect(deletes).toBe(1);
});

test('NumPad ignores input while disabled', async ({ mount }) => {
    const digits: string[] = [];
    const c = await mount(
        <div className={STAGE}>
            <NumPad onDigit={d => digits.push(d)} onDelete={() => {}} canDelete disabled />
        </div>
    );
    await expect(c.getByRole('button', { name: '5', exact: true })).toBeDisabled();
    expect(digits).toEqual([]);
});
