import { expect, screenshotEachMode, test } from '../../../../playwright/test';
import { RecipientSuggestionsView } from './SendRecipientSuggestions';

const noop = () => {};

const ROWS = [
    {
        address: 'UQBFav…fav1',
        title: 'Alice',
        subtitle: 'UQBFav…fav1',
        isFavorite: true
    },
    {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        title: '0x123456…5678',
        subtitle: '12 June',
        isFavorite: false
    },
    {
        address: 'UQRec…ent2',
        title: 'UQRec…ent2',
        subtitle: '3 May',
        isFavorite: false
    }
];

screenshotEachMode('RecipientSuggestionsView', () => (
    <RecipientSuggestionsView rows={ROWS} onSelect={noop} onToggleFavorite={noop} />
));

test('empty rows render nothing', async ({ mount }) => {
    const c = await mount(
        <RecipientSuggestionsView rows={[]} onSelect={noop} onToggleFavorite={noop} />
    );
    await expect(c.getByRole('button')).toHaveCount(0);
});

test('clicking a row selects its address', async ({ mount }) => {
    let selected: string | undefined;
    const c = await mount(
        <RecipientSuggestionsView
            rows={ROWS}
            onSelect={address => {
                selected = address;
            }}
            onToggleFavorite={noop}
        />
    );
    await c.getByRole('button', { name: 'Alice' }).click();
    expect(selected).toBe('UQBFav…fav1');
});

test('star action reports the row address', async ({ mount }) => {
    let toggled: string | undefined;
    const c = await mount(
        <RecipientSuggestionsView
            rows={ROWS}
            onSelect={noop}
            onToggleFavorite={address => {
                toggled = address;
            }}
        />
    );
    await c.getByRole('button', { name: 'Add to favorites' }).first().click();
    expect(toggled).toBe('0x1234567890abcdef1234567890abcdef12345678');
});

test('favorite rows offer delete, recents offer add', async ({ mount }) => {
    const c = await mount(
        <RecipientSuggestionsView rows={ROWS} onSelect={noop} onToggleFavorite={noop} />
    );
    await expect(c.getByRole('button', { name: 'Delete' })).toHaveCount(1);
    await expect(c.getByRole('button', { name: 'Add to favorites' })).toHaveCount(2);
});
