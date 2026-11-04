import { IconButton } from './IconButton';
import { SendIcon, ReceiveIcon } from './home/HomeIcons';
import { expect, screenshot, test } from '../../playwright/test';

// The design-system "Icon Button" (round icon + Label3 caption). No app context,
// so it mounts directly. App-level `home/Actions` composes it with analytics/SDK.
screenshot('IconButton default', () => <IconButton icon={<SendIcon />} label="Send" />);
screenshot('IconButton hovered', () => (
    <IconButton icon={<ReceiveIcon />} label="Receive" hovered />
));
screenshot('IconButton disabled', () => <IconButton icon={<SendIcon />} label="Send" disabled />);

test('IconButton forwards onClick', async ({ mount }) => {
    let clicks = 0;
    const component = await mount(
        <IconButton icon={<SendIcon />} label="Send" onClick={() => (clicks += 1)} />
    );
    await component.click();
    expect(clicks).toBe(1);
});

test('disabled IconButton does not fire onClick', async ({ mount }) => {
    let clicks = 0;
    const component = await mount(
        <IconButton icon={<SendIcon />} label="Send" disabled onClick={() => (clicks += 1)} />
    );
    await component.click();
    expect(clicks).toBe(0);
});
