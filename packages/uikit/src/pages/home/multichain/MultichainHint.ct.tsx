import { expect, screenshot, test } from '../../../../playwright/test';
import { cn } from '../../../libs/css';
import { MultichainHint } from './MultichainHint';

// Behaviour targets:
//   - mouse hover shows the bubble, moving away hides it;
//   - a mouse click doesn't cancel the hover-opened bubble;
//   - keyboard activation (the non-mouse click path, same as touch)
//     toggles the bubble.

const STAGE = 'flex h-[160px] w-[360px] items-end bg-backgroundPage p-6';

screenshot(
    'MultichainHint bubble',
    () => (
        <div className={STAGE}>
            <MultichainHint
                label="Value difference"
                text="How much your trade moves the price — positive gets you more, negative gets you less."
            />
        </div>
    ),
    'desktop',
    {
        interact: async component => {
            const trigger = component.getByRole('button', { name: 'Value difference' });
            await trigger.focus();
            await trigger.press('Enter');
            await expect(component.getByRole('tooltip')).toBeVisible();
        }
    }
);

screenshot(
    'MultichainHint bubble end-aligned',
    () => (
        <div className={cn(STAGE, 'justify-end')}>
            <MultichainHint
                label="Avoid extra fees on future swaps"
                text="Swapping this token requires a separate approval transaction with its own network fee."
                align="end"
            />
        </div>
    ),
    'desktop',
    {
        interact: async component => {
            const trigger = component.getByRole('button', {
                name: 'Avoid extra fees on future swaps'
            });
            await trigger.focus();
            await trigger.press('Enter');
            await expect(component.getByRole('tooltip')).toBeVisible();
        }
    }
);

test('MultichainHint shows on hover and hides on leave', async ({ mount, page }) => {
    const c = await mount(
        <div className={STAGE}>
            <MultichainHint
                label="Market Cap"
                text="Total value of all existing tokens at current price."
            />
        </div>
    );
    const trigger = c.getByRole('button', { name: 'Market Cap' });
    await trigger.hover();
    await expect(c.getByRole('tooltip')).toContainText(
        'Total value of all existing tokens at current price.'
    );
    await trigger.click();
    await expect(c.getByRole('tooltip')).toBeVisible();
    await page.mouse.move(10, 10);
    await expect(c.getByRole('tooltip')).not.toBeVisible();
});

test('MultichainHint keyboard activation toggles the bubble', async ({ mount }) => {
    const c = await mount(
        <div className={STAGE}>
            <MultichainHint label="Volume" text="24h volume of all transactions." />
        </div>
    );
    const trigger = c.getByRole('button', { name: 'Volume' });
    await trigger.focus();
    await trigger.press('Enter');
    await expect(c.getByRole('tooltip')).toBeVisible();
    await trigger.press('Enter');
    await expect(c.getByRole('tooltip')).not.toBeVisible();
});
