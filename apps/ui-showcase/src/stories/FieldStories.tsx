import { ReactNode, useState } from 'react';
import { FieldWord, Input, SearchField, TextArea } from '@tonkeeper/ui-kit';
import { InputIconButton, InputPillButton, InputTextButton } from '@tonkeeper/ui-kit';
import IcQrViewfinderOutline28 from '@tonkeeper/ui-kit/icons/IcQrViewfinderOutline28';
import { Cell, Group, Page, noop } from '../kit';

const FIELD_WIDTH = 'w-[358px]';

const Fields = ({ children }: { children: ReactNode }) => (
    <div className="grid grid-cols-[repeat(auto-fill,358px)] gap-x-8 max-md:grid-cols-1 gap-y-6">
        {children}
    </div>
);

export const InputStory = () => {
    const [value, setValue] = useState('');
    const [clearable, setClearable] = useState('UQBx…3hK2');
    return (
        <Page
            title="Input"
            description="Text field with a floating label. Click a field to see the focused border; the label lifts once the field is focused or filled."
            importLine="import { Input } from '@tonkeeper/ui-kit'"
        >
            <Group title="States" note="size=medium">
                <Fields>
                    <Cell label="empty" className={FIELD_WIDTH}>
                        <Input id="in-empty" value="" onChange={noop} label="Address" />
                    </Cell>
                    <Cell label="filled" className={FIELD_WIDTH}>
                        <Input id="in-filled" value="wallet.ton" onChange={noop} label="Address" />
                    </Cell>
                    <Cell label="interactive" className={FIELD_WIDTH}>
                        <Input id="in-live" value={value} onChange={setValue} label="Address" />
                    </Cell>
                    <Cell label="isValid=false + helpText" className={FIELD_WIDTH}>
                        <Input
                            id="in-error"
                            value="wallet.tn"
                            onChange={noop}
                            label="Address"
                            isValid={false}
                            helpText="Invalid address"
                        />
                    </Cell>
                    <Cell label="helpText" className={FIELD_WIDTH}>
                        <Input
                            id="in-help"
                            value=""
                            onChange={noop}
                            label="Comment"
                            helpText="Visible to everyone"
                        />
                    </Cell>
                    <Cell label="disabled" className={FIELD_WIDTH}>
                        <Input
                            id="in-disabled"
                            value="wallet.ton"
                            onChange={noop}
                            label="Address"
                            disabled
                        />
                    </Cell>
                    <Cell label="no label (placeholder)" className={FIELD_WIDTH}>
                        <Input id="in-placeholder" value="" onChange={noop} placeholder="Amount" />
                    </Cell>
                </Fields>
            </Group>
            <Group title="Trailing content">
                <Fields>
                    <Cell label="clearButton (shows when filled)" className={FIELD_WIDTH}>
                        <Input
                            id="in-clear"
                            value={clearable}
                            onChange={setClearable}
                            label="Address"
                            clearButton
                        />
                    </Cell>
                    <Cell label="InputTextButton" className={FIELD_WIDTH}>
                        <Input
                            id="in-text-btn"
                            value=""
                            onChange={noop}
                            label="Address"
                            rightElement={<InputTextButton onClick={noop}>Paste</InputTextButton>}
                        />
                    </Cell>
                    <Cell label="InputIconButton" className={FIELD_WIDTH}>
                        <Input
                            id="in-icon-btn"
                            value=""
                            onChange={noop}
                            label="Address"
                            rightElement={
                                <InputIconButton aria-label="Scan" onClick={noop}>
                                    <IcQrViewfinderOutline28 />
                                </InputIconButton>
                            }
                        />
                    </Cell>
                    <Cell label="InputTextButton + InputIconButton" className={FIELD_WIDTH}>
                        <Input
                            id="in-text-icon-btn"
                            value=""
                            onChange={noop}
                            label="Address"
                            rightElement={
                                <>
                                    <InputTextButton onClick={noop}>Paste</InputTextButton>
                                    <InputIconButton aria-label="Scan" onClick={noop}>
                                        <IcQrViewfinderOutline28 />
                                    </InputIconButton>
                                </>
                            }
                        />
                    </Cell>
                    <Cell label="InputPillButton" className={FIELD_WIDTH}>
                        <Input
                            id="in-pill-btn"
                            value=""
                            onChange={noop}
                            placeholder="Address"
                            rightElement={<InputPillButton onClick={noop}>Paste</InputPillButton>}
                        />
                    </Cell>
                </Fields>
            </Group>
            <Group title="size=small" note="The label becomes a placeholder">
                <Fields>
                    <Cell label="empty" className={FIELD_WIDTH}>
                        <Input
                            id="in-s-empty"
                            value=""
                            onChange={noop}
                            label="Search"
                            size="small"
                        />
                    </Cell>
                    <Cell label="filled" className={FIELD_WIDTH}>
                        <Input
                            id="in-s-filled"
                            value="USDT"
                            onChange={noop}
                            label="Search"
                            size="small"
                        />
                    </Cell>
                    <Cell label="isValid=false" className={FIELD_WIDTH}>
                        <Input
                            id="in-s-error"
                            value="USDT"
                            onChange={noop}
                            label="Search"
                            size="small"
                            isValid={false}
                        />
                    </Cell>
                </Fields>
            </Group>
        </Page>
    );
};

export const TextAreaStory = () => {
    const [value, setValue] = useState('');
    const [clearable, setClearable] = useState('EQCceBtmfDHu6636TXmba9yImH7pqNRiYkm3UoDe1RyN9ZLD');
    return (
        <Page
            title="TextArea"
            description="Multi-line Input that grows with its content. Same states as Input."
            importLine="import { TextArea } from '@tonkeeper/ui-kit'"
        >
            <Group title="States">
                <Fields>
                    <Cell label="empty (interactive)" className={FIELD_WIDTH}>
                        <TextArea id="ta-live" value={value} onChange={setValue} label="Comment" />
                    </Cell>
                    <Cell label="filled" className={FIELD_WIDTH}>
                        <TextArea
                            id="ta-filled"
                            value={'Rent for September.\nThanks!'}
                            onChange={noop}
                            label="Comment"
                        />
                    </Cell>
                    <Cell label="isValid=false + helpText" className={FIELD_WIDTH}>
                        <TextArea
                            id="ta-error"
                            value="blanket cabbage"
                            onChange={noop}
                            label="Recovery phrase"
                            isValid={false}
                            helpText="Incorrect words"
                        />
                    </Cell>
                    <Cell label="clearButton (shows when filled)" className={FIELD_WIDTH}>
                        <TextArea
                            id="ta-clear"
                            value={clearable}
                            onChange={setClearable}
                            label="Address"
                            clearButton
                        />
                    </Cell>
                    <Cell label="disabled" className={FIELD_WIDTH}>
                        <TextArea
                            id="ta-disabled"
                            value="Rent for September"
                            onChange={noop}
                            label="Comment"
                            disabled
                        />
                    </Cell>
                </Fields>
            </Group>
        </Page>
    );
};

export const SearchFieldStory = () => {
    const [value, setValue] = useState('');
    return (
        <Page
            title="SearchField"
            description="Search box with a clear button once filled. Passing onCancel switches to the header layout with a trailing Cancel."
            importLine="import { SearchField } from '@tonkeeper/ui-kit'"
        >
            <Group title="Default">
                <Fields>
                    <Cell label="empty (interactive)" className="w-[390px]">
                        <SearchField value={value} onChange={setValue} />
                    </Cell>
                    <Cell label="filled" className="w-[390px]">
                        <SearchField value="Tether" onChange={noop} />
                    </Cell>
                    <Cell label="disabled" className="w-[390px]">
                        <SearchField value="" onChange={noop} disabled />
                    </Cell>
                </Fields>
            </Group>
            <Group title="Header (onCancel)">
                <Fields>
                    <Cell label="empty" className="w-[390px]">
                        <SearchField value="" onChange={noop} onCancel={noop} />
                    </Cell>
                    <Cell label="filled" className="w-[390px]">
                        <SearchField value="Tether" onChange={noop} onCancel={noop} />
                    </Cell>
                </Fields>
            </Group>
            <Group title="Header, headerVariant=modal" note="Taller row used atop a sheet">
                <Fields>
                    <Cell label="empty" className="w-[390px]">
                        <SearchField
                            value=""
                            onChange={noop}
                            onCancel={noop}
                            headerVariant="modal"
                        />
                    </Cell>
                    <Cell label="filled" className="w-[390px]">
                        <SearchField
                            value="Tether"
                            onChange={noop}
                            onCancel={noop}
                            headerVariant="modal"
                        />
                    </Cell>
                </Fields>
            </Group>
        </Page>
    );
};

export const FieldWordStory = () => {
    const [value, setValue] = useState('');
    return (
        <Page
            title="FieldWord"
            description="Numbered single-word field for entering a recovery phrase."
            importLine="import { FieldWord } from '@tonkeeper/ui-kit'"
        >
            <Group title="States">
                <Fields>
                    <Cell label="empty (interactive)" className={FIELD_WIDTH}>
                        <FieldWord number={1} value={value} onChange={setValue} />
                    </Cell>
                    <Cell label="filled" className={FIELD_WIDTH}>
                        <FieldWord number={2} value="blanket" onChange={noop} />
                    </Cell>
                    <Cell label="error" className={FIELD_WIDTH}>
                        <FieldWord number={3} value="cabage" onChange={noop} error />
                    </Cell>
                    <Cell label="disabled" className={FIELD_WIDTH}>
                        <FieldWord number={24} value="zebra" onChange={noop} disabled />
                    </Cell>
                </Fields>
            </Group>
        </Page>
    );
};
