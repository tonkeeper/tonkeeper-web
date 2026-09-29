import { IconButton } from './IconButton';
import IcArrowUpOutline28 from '../icons/components/IcArrowUpOutline28';
import { expect, screenshot, test } from '../../playwright/test';

screenshot('IconButton default', () => (
    <IconButton icon={<IcArrowUpOutline28 className="h-7 w-7" />} label="Send" />
));

test('IconButton forwards onClick', async ({ mount }) => {
    let clicks = 0;
    const component = await mount(
        <IconButton
            icon={<IcArrowUpOutline28 className="h-7 w-7" />}
            label="Send"
            onClick={() => (clicks += 1)}
        />
    );
    await component.click();
    expect(clicks).toBe(1);
});
