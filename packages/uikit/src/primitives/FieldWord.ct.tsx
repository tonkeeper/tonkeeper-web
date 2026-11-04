import { FieldWord } from './FieldWord';
import { expect, screenshot, test } from '../../playwright/test';

screenshot('FieldWord empty', () => (
    <div className="w-[358px]">
        <FieldWord number={17} value="" onChange={() => {}} />
    </div>
));
screenshot('FieldWord filled', () => (
    <div className="w-[358px]">
        <FieldWord number={17} value="blanket" onChange={() => {}} />
    </div>
));
screenshot('FieldWord error', () => (
    <div className="w-[358px]">
        <FieldWord number={17} value="blanket" error onChange={() => {}} />
    </div>
));
screenshot('FieldWord focused', () => (
    <div className="w-[358px]">
        <FieldWord number={17} value="" autoFocus onChange={() => {}} />
    </div>
));

test('FieldWord forwards typing to onChange', async ({ mount }) => {
    let last = '';
    let calls = 0;
    const component = await mount(
        <FieldWord
            number={1}
            value=""
            onChange={v => {
                calls += 1;
                last = v;
            }}
        />
    );
    await component.locator('input').type('b');
    expect(calls).toBe(1);
    expect(last).toBe('b');
});

test('error prop applies the error border colour', async ({ mount }) => {
    const component = await mount(<FieldWord number={1} value="x" onChange={() => {}} error />);
    const borderColor = await component.evaluate(el => getComputedStyle(el).borderTopColor);
    expect(borderColor).not.toBe('rgba(0, 0, 0, 0)');
});
