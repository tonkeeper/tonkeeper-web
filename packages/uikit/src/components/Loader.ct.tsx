import { Loader } from './Loader';
import { expect, screenshot, test } from '../../playwright/test';

// Loader has no breakpoint-dependent layout — one screenshot per size is enough.
// (Playwright disables CSS animations for screenshots, so `animate-spin` is
// captured deterministically.)
screenshot('Loader xSmall', () => <Loader size="xSmall" className="text-iconSecondary" />);
screenshot('Loader small', () => <Loader size="small" className="text-iconSecondary" />);
screenshot('Loader medium', () => <Loader size="medium" className="text-iconSecondary" />);

test('Loader exposes a progressbar role', async ({ mount }) => {
    const component = await mount(<Loader size="small" />);
    await expect(component).toHaveAttribute('role', 'progressbar');
});
