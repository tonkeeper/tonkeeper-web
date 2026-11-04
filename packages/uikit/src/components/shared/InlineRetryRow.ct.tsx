import { expect, screenshotEachMode, test } from '../../../playwright/test';
import { InlineRetryRow } from './InlineRetryRow';

screenshotEachMode('InlineRetryRow', () => (
    <div className="w-[390px] rounded-medium bg-backgroundContent">
        <InlineRetryRow onRetry={() => {}} />
    </div>
));

screenshotEachMode('InlineRetryRow custom text', () => (
    <div className="w-[390px] rounded-medium bg-backgroundContent">
        <InlineRetryRow text="Some connected apps couldn’t be loaded" onRetry={() => {}} />
    </div>
));

test('retry fires the callback', async ({ mount }) => {
    let retried = 0;
    const c = await mount(<InlineRetryRow onRetry={() => (retried += 1)} />);
    await c.getByRole('button', { name: 'Retry' }).click();
    expect(retried).toBe(1);
});
