import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { ConnectedAppTile } from './ConnectedAppTile';

const ICON =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23ff007a"/></svg>';

const noop = () => {};

// Service Card Medium grid cells: icon with a chain badge, icon without a
// badge (unknown chain), and the no-icon placeholder stub (Figma Browser
// "Thumb" placeholder state). The hover-only close pill stays hidden at
// rest, so it doesn't appear in the base screenshots.
screenshotEachMode(
    'ConnectedAppTile',
    () => (
        <div className="grid w-[358px] grid-cols-[repeat(auto-fill,88px)] justify-between">
            <ConnectedAppTile
                name="Uniswap"
                icon={ICON}
                chains={['eth']}
                onOpen={noop}
                onRequestDisconnect={noop}
                onLongPress={noop}
            />
            <ConnectedAppTile
                name="Tonstakers"
                icon={ICON}
                onOpen={noop}
                onRequestDisconnect={noop}
                onLongPress={noop}
            />
            <ConnectedAppTile
                name="example.com"
                chains={['ton']}
                onOpen={noop}
                onRequestDisconnect={noop}
                onLongPress={noop}
            />
        </div>
    ),
    ['desktop', 'mobile']
);

test('tile opens the app; hover close pill requests disconnect', async ({ mount }) => {
    const events: string[] = [];
    const component = await mount(
        <ConnectedAppTile
            name="Uniswap"
            icon={ICON}
            chains={['eth']}
            onOpen={() => events.push('open')}
            onRequestDisconnect={() => events.push('disconnect')}
            onLongPress={() => events.push('longpress')}
        />
    );

    await component.getByRole('button', { name: 'Uniswap' }).click();

    await component.hover();
    await component.getByRole('button', { name: 'Disconnect' }).click();

    expect(events).toEqual(['open', 'disconnect']);
});

test('touch long-press fires onLongPress instead of opening', async ({ mount }) => {
    const events: string[] = [];
    const component = await mount(
        <ConnectedAppTile
            name="Uniswap"
            icon={ICON}
            onOpen={() => events.push('open')}
            onRequestDisconnect={() => events.push('disconnect')}
            onLongPress={() => events.push('longpress')}
        />
    );

    const tile = component.getByRole('button', { name: 'Uniswap' });
    await tile.dispatchEvent('pointerdown', { pointerType: 'touch' });
    // Wait for the press timer itself rather than a fixed sleep — a busy
    // machine can hold the browser timer past any chosen delay.
    await expect.poll(() => events).toContain('longpress');
    await tile.dispatchEvent('pointerup', { pointerType: 'touch' });
    // The click a real touch release generates is swallowed after a fired
    // long-press; dispatch it explicitly to assert the suppression.
    await tile.dispatchEvent('click');

    expect(events).toEqual(['longpress']);
});
