import { expect, screenshot, test } from '../../../../../playwright/test';
import { ManageCryptoSaveBar } from './ManageCryptoSaveBar';

// Edge cases the suite targets:
//   - the bar is the last child of the modal column and is pulled 44px up over
//     the token list, so the frame gives it a list surface to overlap and
//     clips like the modal card does.
//   - `isSaving` swaps the label for the button's loader and disables it, so
//     onSave can't fire twice while a save is in flight.
//   - mobile keeps a home-indicator spacer under the button, desktop doesn't.

// CT's static mount-loader can't resolve wrappers defined in the test file,
// so the frame the bar overlaps is inlined as class strings.
const FRAME = 'flex h-[220px] w-[400px] flex-col overflow-hidden bg-backgroundPage';
const LIST = 'mx-4 mb-4 flex-1 rounded-medium bg-backgroundContent';

screenshot('ManageCryptoSaveBar idle', () => (
    <div className={FRAME}>
        <div className={LIST} />
        <ManageCryptoSaveBar onSave={() => {}} isSaving={false} compact />
    </div>
));

screenshot('ManageCryptoSaveBar saving', () => (
    <div className={FRAME}>
        <div className={LIST} />
        <ManageCryptoSaveBar onSave={() => {}} isSaving compact />
    </div>
));

screenshot('ManageCryptoSaveBar mobile keeps the home indicator spacer', () => (
    <div className={FRAME}>
        <div className={LIST} />
        <ManageCryptoSaveBar onSave={() => {}} isSaving={false} />
    </div>
));

test('ManageCryptoSaveBar fires onSave when idle', async ({ mount }) => {
    let saved = 0;
    const c = await mount(
        <div className={FRAME}>
            <div className={LIST} />
            <ManageCryptoSaveBar onSave={() => saved++} isSaving={false} compact />
        </div>
    );
    await expect(c.getByRole('button')).toContainText('Save Changes');
    await c.getByRole('button').click();
    expect(saved).toBe(1);
});

test('ManageCryptoSaveBar disables the button while saving', async ({ mount }) => {
    let saved = 0;
    const c = await mount(
        <div className={FRAME}>
            <div className={LIST} />
            <ManageCryptoSaveBar onSave={() => saved++} isSaving compact />
        </div>
    );
    const button = c.getByRole('button');
    await expect(button).toBeDisabled();
    await button.click({ force: true });
    expect(saved).toBe(0);
});
