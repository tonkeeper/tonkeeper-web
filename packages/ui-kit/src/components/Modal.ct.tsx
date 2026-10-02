import type { Locator } from 'playwright-core';
import {
    ActionBarModalStory,
    AlertModalStory,
    ContentModalStory,
    NestedModalsStory
} from './ModalStory';
import { TEST_MODES, expect, screenshotEachMode, test } from '../../playwright/test';

screenshotEachMode('Modal alert', () => <AlertModalStory />, ['desktop', 'mobile'], {
    target: 'dialog'
});

screenshotEachMode('Modal content', () => <ContentModalStory />, ['desktop', 'mobile'], {
    target: 'dialog'
});

screenshotEachMode('Modal nested', () => <NestedModalsStory />, ['desktop', 'mobile'], {
    target: 'page'
});

screenshotEachMode(
    'Modal left title with description',
    () => <ContentModalStory topBarTitleAlign="left" topBarDescription="app.uniswap.org" />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

screenshotEachMode(
    'Modal centered title with description',
    () => <ContentModalStory topBarDescription="app.uniswap.org" />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

screenshotEachMode(
    'Modal action bar row with divider and description',
    () => <ActionBarModalStory />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

const box = async (locator: Locator) => {
    const b = await locator.boundingBox();
    if (!b) throw new Error('element is not rendered');
    return b;
};

test('alert is sized to its content', async ({ mount, page }) => {
    await page.setViewportSize(TEST_MODES.desktop);
    await mount(<AlertModalStory />, { hooksConfig: { mode: 'desktop' } });
    const dialog = await box(page.getByRole('dialog'));
    expect(dialog.width).toBe(520);
    expect(dialog.height).toBeLessThan(624);
});

test('content is 624px tall when the viewport allows it', async ({ mount, page }) => {
    await page.setViewportSize(TEST_MODES.desktop);
    await mount(<ContentModalStory />, { hooksConfig: { mode: 'desktop' } });
    const dialog = await box(page.getByRole('dialog'));
    expect(dialog.width).toBe(520);
    expect(dialog.height).toBe(624);
});

test('content shrinks to the viewport minus insets on a short window', async ({ mount, page }) => {
    await page.setViewportSize({ width: 1280, height: 500 });
    await mount(<ContentModalStory />, { hooksConfig: { mode: 'desktop' } });
    const dialog = await box(page.getByRole('dialog'));
    expect(dialog.height).toBe(500 - 32);
});

test('a nested modal shorter than its parent pins to the parent bottom edge', async ({
    mount,
    page
}) => {
    await page.setViewportSize(TEST_MODES.desktop);
    await mount(<NestedModalsStory />, { hooksConfig: { mode: 'desktop' } });
    const dialogs = page.getByRole('dialog');
    await expect(dialogs).toHaveCount(2);
    const parent = await box(dialogs.nth(0));
    const nested = await box(dialogs.nth(1));
    expect(nested.height).toBeLessThan(parent.height);
    expect(nested.x).toBeCloseTo(parent.x, 0);
    expect(nested.width).toBeCloseTo(parent.width, 0);
    expect(nested.y + nested.height).toBeCloseTo(parent.y + parent.height, 0);
});

test('a nested modal at least as tall as its parent covers it', async ({ mount, page }) => {
    await page.setViewportSize(TEST_MODES.desktop);
    await mount(<NestedModalsStory nestedVariant="content" />, {
        hooksConfig: { mode: 'desktop' }
    });
    const dialogs = page.getByRole('dialog');
    await expect(dialogs).toHaveCount(2);
    const parent = await box(dialogs.nth(0));
    const nested = await box(dialogs.nth(1));
    expect(nested.x).toBeCloseTo(parent.x, 0);
    expect(nested.y).toBeCloseTo(parent.y, 0);
    expect(nested.width).toBeCloseTo(parent.width, 0);
    expect(nested.height).toBeCloseTo(parent.height, 0);
});

test('Escape closes only the topmost modal', async ({ mount, page }) => {
    let parentClosed = 0;
    let nestedClosed = 0;
    await page.setViewportSize(TEST_MODES.desktop);
    await mount(
        <ContentModalStory onClose={() => (parentClosed += 1)}>
            <AlertModalStory onClose={() => (nestedClosed += 1)} />
        </ContentModalStory>,
        { hooksConfig: { mode: 'desktop' } }
    );
    await expect(page.getByRole('dialog')).toHaveCount(2);
    await page.keyboard.press('Escape');
    expect(nestedClosed).toBe(1);
    expect(parentClosed).toBe(0);
});

test('a row action bar gives its buttons equal widths', async ({ mount, page }) => {
    await page.setViewportSize(TEST_MODES.desktop);
    await mount(<ActionBarModalStory />, { hooksConfig: { mode: 'desktop' } });
    const cancel = await box(page.getByRole('button', { name: 'Cancel' }));
    const connect = await box(page.getByRole('button', { name: 'Connect' }));
    expect(cancel.width).toBeCloseTo(connect.width, 0);
    expect(cancel.y).toBeCloseTo(connect.y, 0);
});
