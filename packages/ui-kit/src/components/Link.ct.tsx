import { Link } from './Link';
import { expect, screenshot, test } from '../../playwright/test';

screenshot('Link default', () => <Link>Open</Link>);

test('Link forwards onClick', async ({ mount }) => {
    let clicks = 0;
    const component = await mount(<Link onClick={() => (clicks += 1)}>Click</Link>);
    await component.click();
    expect(clicks).toBe(1);
});

test('Link sets a default type of "button"', async ({ mount }) => {
    const component = await mount(<Link>Open</Link>);
    await expect(component).toHaveAttribute('type', 'button');
});
