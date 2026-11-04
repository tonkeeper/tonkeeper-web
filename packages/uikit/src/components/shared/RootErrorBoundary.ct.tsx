import { expect, screenshotEachMode, test } from '../../../playwright/test';
import { RootErrorBoundaryStory } from './RootErrorBoundaryStory';

screenshotEachMode('RootErrorBoundary fallback', () => <RootErrorBoundaryStory fail />);

test('renders children when nothing throws', async ({ mount }) => {
    const c = await mount(<RootErrorBoundaryStory fail={false} />);
    await expect(c.getByText('App content')).toBeVisible();
});

test('a render error shows the generic error with Retry', async ({ mount }) => {
    const c = await mount(<RootErrorBoundaryStory fail />);
    await expect(c.getByText('Something went wrong')).toBeVisible();
    await expect(c.getByRole('button', { name: 'Retry' })).toBeVisible();
});
