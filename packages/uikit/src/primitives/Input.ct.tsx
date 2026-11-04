import { Input } from './Input';
import { expect, screenshot, test } from '../../playwright/test';

screenshot('Input empty with label', () => (
    <div className="w-[358px]">
        <Input id="i1" value="" onChange={() => {}} label="Label" />
    </div>
));
screenshot('Input filled with label', () => (
    <div className="w-[358px]">
        <Input id="i2" value="Thanks" onChange={() => {}} label="Label" />
    </div>
));
screenshot('Input error with help text', () => (
    <div className="w-[358px]">
        <Input
            id="i3"
            value=""
            onChange={() => {}}
            label="Label"
            isValid={false}
            helpText="Please fill this in"
        />
    </div>
));
screenshot('Input success', () => (
    <div className="w-[358px]">
        <Input id="i4" value="filled" onChange={() => {}} label="Label" isSuccess />
    </div>
));
screenshot('Input no label (placeholder mode)', () => (
    <div className="w-[358px]">
        <Input id="i5" value="" onChange={() => {}} placeholder="Label" />
    </div>
));
screenshot('Input small', () => (
    <div className="w-[358px]">
        <Input id="i6" value="" onChange={() => {}} label="Search" size="small" />
    </div>
));
screenshot('Input with clear button', () => (
    <div className="w-[358px]">
        <Input id="i7" value="Thanks" onChange={() => {}} label="Label" clearButton />
    </div>
));

test('Input forwards typing to onChange', async ({ mount }) => {
    let last = '';
    let calls = 0;
    const component = await mount(
        <Input
            id="i"
            value=""
            label="Label"
            onChange={v => {
                calls += 1;
                last = v;
            }}
        />
    );
    await component.locator('input').type('a');
    expect(calls).toBe(1);
    expect(last).toBe('a');
});

test('Clear button calls onChange with an empty string', async ({ mount }) => {
    let last = 'Thanks';
    const component = await mount(
        <Input id="i" value="Thanks" label="Label" clearButton onChange={v => (last = v)} />
    );
    await component.locator('svg').last().click();
    expect(last).toBe('');
});

test('isValid=false renders the error border', async ({ mount }) => {
    const component = await mount(
        <Input id="i" value="" label="Label" isValid={false} onChange={() => {}} />
    );
    const block = component
        .locator('div')
        .filter({ hasText: /^Label$/ })
        .first();
    const borderColor = await block.evaluate(el => getComputedStyle(el).borderTopColor);
    expect(borderColor).not.toBe('rgba(0, 0, 0, 0)');
});
