import { useState } from 'react';
import { Checkbox, Radio, SegmentedControl, Switch } from '@tonkeeper/ui-kit';
import { Cell, Cells, Group, Matrix, Page, noop } from '../kit';

const CHECK_STATES = ['unchecked', 'checked', 'disabled', 'disabled checked'] as const;
type CheckState = (typeof CHECK_STATES)[number];
const isChecked = (s: CheckState) => s === 'checked' || s === 'disabled checked';
const isDisabled = (s: CheckState) => s.startsWith('disabled');

export const CheckboxStory = () => {
    const [agree, setAgree] = useState(true);
    return (
        <Page
            title="Checkbox"
            description="Square check in two sizes, with an optional label."
            importLine="import { Checkbox } from '@tonkeeper/ui-kit'"
        >
            <Group title="Size × state">
                <Matrix
                    rows={['m', 's'] as const}
                    columns={CHECK_STATES}
                    rowHeader={s => `size=${s}`}
                    render={(size, state) => (
                        <Checkbox
                            size={size}
                            checked={isChecked(state)}
                            disabled={isDisabled(state)}
                            onChange={noop}
                        />
                    )}
                />
            </Group>
            <Group title="With label" note="Interactive">
                <Checkbox checked={agree} onChange={setAgree}>
                    I have saved my recovery phrase
                </Checkbox>
            </Group>
        </Page>
    );
};

export const RadioStory = () => {
    const [value, setValue] = useState('ton');
    return (
        <Page
            title="Radio"
            description="Round single-choice control. `check` fills with a tick, `dot` shows a ring with a centred dot."
            importLine="import { Radio } from '@tonkeeper/ui-kit'"
        >
            <Group title="Variant × state">
                <Matrix
                    rows={['check', 'dot'] as const}
                    columns={CHECK_STATES}
                    rowHeader={v => `variant=${v}`}
                    render={(variant, state) => (
                        <Radio
                            variant={variant}
                            checked={isChecked(state)}
                            disabled={isDisabled(state)}
                            onChange={noop}
                        />
                    )}
                />
            </Group>
            <Group title="With label" note="Interactive">
                <div className="flex flex-col gap-3">
                    {['ton', 'ethereum', 'tron'].map(option => (
                        <Radio
                            key={option}
                            variant="dot"
                            checked={value === option}
                            onChange={() => setValue(option)}
                        >
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                        </Radio>
                    ))}
                </div>
            </Group>
        </Page>
    );
};

export const SwitchStory = () => {
    const [on, setOn] = useState(true);
    return (
        <Page
            title="Switch"
            description="iOS-style toggle. On desktop it renders at 64% scale."
            importLine="import { Switch } from '@tonkeeper/ui-kit'"
        >
            <Group title="States">
                <Cells>
                    <Cell label="off">
                        <Switch checked={false} onChange={noop} />
                    </Cell>
                    <Cell label="on">
                        <Switch checked onChange={noop} />
                    </Cell>
                    <Cell label="disabled off">
                        <Switch checked={false} disabled onChange={noop} />
                    </Cell>
                    <Cell label="disabled on">
                        <Switch checked disabled onChange={noop} />
                    </Cell>
                    <Cell label="interactive">
                        <Switch checked={on} onChange={setOn} />
                    </Cell>
                </Cells>
            </Group>
        </Page>
    );
};

export const SegmentedControlStory = () => {
    const [two, setTwo] = useState('stocks');
    const [three, setThree] = useState('1d');
    return (
        <Page
            title="SegmentedControl"
            description="Equal-width toggle on a dimmed track. Fills its container."
            importLine="import { SegmentedControl } from '@tonkeeper/ui-kit'"
        >
            <Group title="Options">
                <div className="flex max-w-[358px] flex-col gap-6">
                    <Cell label="2 options" className="w-full">
                        <SegmentedControl
                            options={[
                                { value: 'stocks', label: 'Stocks' },
                                { value: 'etfs', label: 'ETFs' }
                            ]}
                            value={two}
                            onChange={setTwo}
                        />
                    </Cell>
                    <Cell label="4 options" className="w-full">
                        <SegmentedControl
                            options={[
                                { value: '1d', label: '1D' },
                                { value: '1w', label: '1W' },
                                { value: '1m', label: '1M' },
                                { value: '1y', label: '1Y' }
                            ]}
                            value={three}
                            onChange={setThree}
                        />
                    </Cell>
                </div>
            </Group>
        </Page>
    );
};
