import { expect, screenshotEachMode, test } from '../../../playwright/test';
import { EnterPasscodeModal } from './EnterPasscodeModal';

screenshotEachMode(
    'EnterPasscodeModal',
    () => <EnterPasscodeModal isOpen onCancel={() => {}} onSubmit={async () => true} />,
    ['mobile'],
    { target: 'dialog' }
);

test('submits the code once the last digit is entered', async ({ mount, page }) => {
    const submitted: string[] = [];
    await mount(
        <EnterPasscodeModal
            isOpen
            onCancel={() => {}}
            onSubmit={async code => {
                submitted.push(code);
                return true;
            }}
        />
    );
    const dialog = page.getByRole('dialog');
    for (const digit of ['1', '2', '3']) {
        await dialog.getByRole('button', { name: digit, exact: true }).click();
    }
    expect(submitted).toEqual([]);
    await dialog.getByRole('button', { name: '4', exact: true }).click();
    await expect.poll(() => submitted).toEqual(['1234']);
});

test('clears a rejected code so the user can retry', async ({ mount, page }) => {
    const submitted: string[] = [];
    await mount(
        <EnterPasscodeModal
            isOpen
            onCancel={() => {}}
            onSubmit={async code => {
                submitted.push(code);
                return code === '0000';
            }}
        />
    );
    const dialog = page.getByRole('dialog');
    for (const digit of ['1', '1', '1', '1']) {
        await dialog.getByRole('button', { name: digit, exact: true }).click();
    }
    await expect(dialog.getByRole('button', { name: '0', exact: true })).toBeEnabled();
    for (const digit of ['0', '0', '0', '0']) {
        await dialog.getByRole('button', { name: digit, exact: true }).click();
    }
    await expect.poll(() => submitted).toEqual(['1111', '0000']);
});

test('backspace removes the last digit', async ({ mount, page }) => {
    const submitted: string[] = [];
    await mount(
        <EnterPasscodeModal
            isOpen
            onCancel={() => {}}
            onSubmit={async code => {
                submitted.push(code);
                return true;
            }}
        />
    );
    const dialog = page.getByRole('dialog');
    for (const digit of ['1', '2', '9']) {
        await dialog.getByRole('button', { name: digit, exact: true }).click();
    }
    await dialog.getByRole('button', { name: 'Delete' }).click();
    for (const digit of ['3', '4']) {
        await dialog.getByRole('button', { name: digit, exact: true }).click();
    }
    await expect.poll(() => submitted).toEqual(['1234']);
});

test('the close button cancels', async ({ mount, page }) => {
    let cancelled = false;
    await mount(
        <EnterPasscodeModal
            isOpen
            onCancel={() => (cancelled = true)}
            onSubmit={async () => true}
        />
    );
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
    expect(cancelled).toBe(true);
});
