import { SearchField } from './SearchField';
import { expect, screenshot, test } from '../../playwright/test';

screenshot('SearchField empty', () => (
    <div className="w-[390px]">
        <SearchField value="" onChange={() => {}} />
    </div>
));
screenshot('SearchField typing', () => (
    <div className="w-[390px]">
        <SearchField value="mercuryo" onChange={() => {}} />
    </div>
));
screenshot('SearchField header empty', () => (
    <div className="w-[390px]">
        <SearchField value="" onChange={() => {}} onCancel={() => {}} />
    </div>
));
screenshot('SearchField header typing', () => (
    <div className="w-[390px]">
        <SearchField value="mercuryo" onChange={() => {}} onCancel={() => {}} />
    </div>
));
screenshot('SearchField modal header typing', () => (
    <div className="w-[390px]">
        <SearchField
            value="mercuryo"
            onChange={() => {}}
            onCancel={() => {}}
            headerVariant="modal"
        />
    </div>
));

test('SearchField forwards typing to onChange', async ({ mount }) => {
    let last = '';
    const component = await mount(<SearchField value="" onChange={v => (last = v)} />);
    await component.locator('input').type('m');
    expect(last).toBe('m');
});

test('Clear button calls onChange with an empty string', async ({ mount }) => {
    let last = 'mercuryo';
    const component = await mount(<SearchField value="mercuryo" onChange={v => (last = v)} />);
    await component.getByRole('button', { name: 'Clear' }).click();
    expect(last).toBe('');
});

test('Clicking anywhere in the box focuses the input', async ({ mount }) => {
    const component = await mount(<SearchField value="" onChange={() => {}} />);
    await component.locator('label').click({ position: { x: 200, y: 24 } });
    await expect(component.locator('input')).toBeFocused();
});

test('Cancel button is only rendered in header mode', async ({ mount }) => {
    const standalone = await mount(<SearchField value="" onChange={() => {}} />);
    await expect(standalone.getByText('Cancel')).toHaveCount(0);
});

test('Cancel button fires onCancel', async ({ mount }) => {
    let cancelled = false;
    const component = await mount(
        <SearchField value="" onChange={() => {}} onCancel={() => (cancelled = true)} />
    );
    await component.getByText('Cancel').click();
    expect(cancelled).toBe(true);
});
