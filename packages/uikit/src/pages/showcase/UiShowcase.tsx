/* eslint-disable i18next/no-literal-string */
import { FC, ReactNode, useState } from 'react';
import {
    AddRemoveButton,
    Button,
    ChainBadgeOverlay,
    ChainChip,
    Checkbox,
    FieldWord,
    IconButton,
    Input,
    Link,
    Loader,
    Modal,
    ModalFooter,
    ModalFooterPortal,
    Radio,
    SearchField,
    Switch,
    TextArea,
    Toast,
    TokenSwitch
} from '../../primitives';
import IcSnowflake16 from '../../icons/components/IcSnowflake16';
import IcPlus28 from '../../icons/components/IcPlus28';
import IcArrowUp28 from '../../icons/components/IcArrowUp28';
import IcChainTon20 from '../../icons/components/IcChainTon20';
import IcChainEth20 from '../../icons/components/IcChainEth20';
import IcChainBtc20 from '../../icons/components/IcChainBtc20';
import IcChainBase20 from '../../icons/components/IcChainBase20';
import IcChainArb20 from '../../icons/components/IcChainArb20';
import IcChainBsc20 from '../../icons/components/IcChainBsc20';
import IcChainTron20 from '../../icons/components/IcChainTron20';

/**
 * Temporary showcase page for the `primitives/` UI kit. DEV-only — wired into
 * apps/web behind `import.meta.env.DEV`. Use to eyeball every variant when
 * tweaking the primitives.
 */

const Section: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
    <section className="border-t border-separatorCommon py-8">
        <h2 className="mb-6 text-label1 text-textPrimary">{title}</h2>
        <div className="flex flex-wrap items-start gap-6">{children}</div>
    </section>
);

const Tile: FC<{ label: string; children: ReactNode; className?: string }> = ({
    label,
    children,
    className
}) => (
    <div className={'flex flex-col gap-2 ' + (className ?? '')}>
        <span className="text-body3 text-textSecondary">{label}</span>
        <div className="flex items-start">{children}</div>
    </div>
);

const ButtonShowcase = () => (
    <Section title="Button">
        <Tile label="primaryBlue">
            <Button variant="primaryBlue">Confirm</Button>
        </Tile>
        <Tile label="secondary">
            <Button variant="secondary">Cancel</Button>
        </Tile>
        <Tile label="tertiary">
            <Button variant="tertiary">Action</Button>
        </Tile>
        <Tile label="primaryGreen">
            <Button variant="primaryGreen">Manage</Button>
        </Tile>
        <Tile label="primaryRed">
            <Button variant="primaryRed">Delete</Button>
        </Tile>
        <Tile label="destructive">
            <Button variant="destructive">Remove</Button>
        </Tile>
        <Tile label="size=small">
            <Button variant="primaryBlue" size="small">
                Small
            </Button>
        </Tile>
        <Tile label="size=medium">
            <Button variant="primaryBlue" size="medium">
                Medium
            </Button>
        </Tile>
        <Tile label="size=large">
            <Button variant="primaryBlue" size="large">
                Large
            </Button>
        </Tile>
        <Tile label="disabled">
            <Button variant="primaryBlue" disabled>
                Disabled
            </Button>
        </Tile>
        <Tile label="loading">
            <Button variant="primaryBlue" loading>
                Loading
            </Button>
        </Tile>
        <Tile label="fullWidth" className="w-full">
            <Button variant="primaryBlue" fullWidth>
                Continue
            </Button>
        </Tile>
        <Tile label="leftIcon">
            <Button variant="secondary" leftIcon={<IcSnowflake16 />}>
                With icon
            </Button>
        </Tile>
        <Tile label="rightIcon">
            <Button variant="secondary" rightIcon={<IcSnowflake16 />}>
                With icon
            </Button>
        </Tile>
        <Tile label="icon-only">
            <Button variant="secondary" leftIcon={<IcSnowflake16 />} />
        </Tile>
    </Section>
);

const LinkShowcase = () => (
    <Section title="Link">
        <Tile label="default">
            <Link>Open</Link>
        </Tile>
        <Tile label="with onClick">
            <Link onClick={() => alert('clicked')}>Click me</Link>
        </Tile>
    </Section>
);

const LoaderShowcase = () => (
    <Section title="Loader">
        <Tile label="xSmall">
            <Loader size="xSmall" className="text-textPrimary" />
        </Tile>
        <Tile label="small">
            <Loader size="small" className="text-textPrimary" />
        </Tile>
        <Tile label="medium">
            <Loader size="medium" className="text-textPrimary" />
        </Tile>
        <Tile label="tinted">
            <Loader size="medium" className="text-iconSecondary" />
        </Tile>
    </Section>
);

const ToastShowcase = () => (
    <Section title="Toast">
        <Tile label="small">
            <Toast text="Copied" size="small" />
        </Tile>
        <Tile label="medium">
            <Toast text="Transaction submitted" size="medium" />
        </Tile>
        <Tile label="loading">
            <Toast text="Submitting…" loading />
        </Tile>
    </Section>
);

const IconButtonShowcase = () => (
    <Section title="IconButton">
        <Tile label="default">
            <IconButton icon={<IcPlus28 />} label="Buy" />
        </Tile>
        <Tile label="hovered">
            <IconButton icon={<IcArrowUp28 />} label="Send" hovered />
        </Tile>
        <Tile label="disabled">
            <IconButton icon={<IcPlus28 />} label="Buy" disabled />
        </Tile>
    </Section>
);

const AddRemoveButtonShowcase = () => (
    <Section title="AddRemoveButton">
        <Tile label="add">
            <AddRemoveButton type="add" />
        </Tile>
        <Tile label="remove">
            <AddRemoveButton type="remove" />
        </Tile>
        <Tile label="disabled">
            <AddRemoveButton type="add" disabled />
        </Tile>
    </Section>
);

const CheckboxShowcase = () => {
    const [a, setA] = useState(false);
    const [b, setB] = useState(true);
    return (
        <Section title="Checkbox / Radio">
            <Tile label="unchecked">
                <Checkbox checked={a} onChange={setA} />
            </Tile>
            <Tile label="checked">
                <Checkbox checked={b} onChange={setB} />
            </Tile>
            <Tile label="with label">
                <Checkbox checked={b} onChange={setB}>
                    I agree to the terms
                </Checkbox>
            </Tile>
            <Tile label="size=s">
                <Checkbox checked size="s" onChange={() => {}} />
            </Tile>
            <Tile label="disabled checked">
                <Checkbox checked disabled onChange={() => {}} />
            </Tile>
            <Tile label="radio check unchecked">
                <Radio checked={false} onChange={() => {}} />
            </Tile>
            <Tile label="radio check checked">
                <Radio checked onChange={() => {}} />
            </Tile>
            <Tile label="radio dot checked">
                <Radio variant="dot" checked onChange={() => {}} />
            </Tile>
        </Section>
    );
};

const SwitchShowcase = () => {
    const [on, setOn] = useState(true);
    return (
        <Section title="Switch">
            <Tile label="controlled">
                <Switch checked={on} onChange={setOn} />
            </Tile>
            <Tile label="off">
                <Switch checked={false} onChange={() => {}} />
            </Tile>
            <Tile label="disabled on">
                <Switch checked disabled onChange={() => {}} />
            </Tile>
        </Section>
    );
};

const InputShowcase = () => {
    const [a, setA] = useState('');
    const [b, setB] = useState('Hello');
    const [c, setC] = useState('');
    const [d, setD] = useState('Goodbye');
    const [textarea, setTextarea] = useState('');
    return (
        <Section title="Input / TextArea">
            <Tile label="empty + label" className="w-[358px]">
                <Input id="sc-a" value={a} onChange={setA} label="Label" />
            </Tile>
            <Tile label="filled + label" className="w-[358px]">
                <Input id="sc-b" value={b} onChange={setB} label="Label" />
            </Tile>
            <Tile label="error + helpText" className="w-[358px]">
                <Input
                    id="sc-c"
                    value={c}
                    onChange={setC}
                    label="Label"
                    isValid={false}
                    helpText="Please fill this in"
                />
            </Tile>
            <Tile label="success" className="w-[358px]">
                <Input id="sc-d" value="filled" onChange={() => {}} label="Label" isSuccess />
            </Tile>
            <Tile label="placeholder only" className="w-[358px]">
                <Input id="sc-e" value="" onChange={() => {}} placeholder="Search…" />
            </Tile>
            <Tile label="small" className="w-[358px]">
                <Input id="sc-f" value="" onChange={() => {}} label="Search" size="small" />
            </Tile>
            <Tile label="clearButton" className="w-[358px]">
                <Input id="sc-g" value={d} onChange={setD} label="Label" clearButton />
            </Tile>
            <Tile label="TextArea" className="w-[358px]">
                <TextArea id="sc-h" value={textarea} onChange={setTextarea} label="Comment" />
            </Tile>
        </Section>
    );
};

const SearchFieldShowcase = () => {
    const [a, setA] = useState('');
    const [b, setB] = useState('mercuryo');
    return (
        <Section title="SearchField">
            <Tile label="empty" className="w-[390px]">
                <SearchField value={a} onChange={setA} />
            </Tile>
            <Tile label="typing" className="w-[390px]">
                <SearchField value={b} onChange={setB} />
            </Tile>
            <Tile label="header empty" className="w-[390px]">
                <SearchField value="" onChange={() => {}} onCancel={() => {}} />
            </Tile>
            <Tile label="header typing" className="w-[390px]">
                <SearchField value="mercuryo" onChange={() => {}} onCancel={() => {}} />
            </Tile>
        </Section>
    );
};

const FieldWordShowcase = () => {
    const [a, setA] = useState('blanket');
    return (
        <Section title="FieldWord">
            <Tile label="empty" className="w-[358px]">
                <FieldWord number={1} value="" onChange={() => {}} />
            </Tile>
            <Tile label="filled" className="w-[358px]">
                <FieldWord number={17} value={a} onChange={setA} />
            </Tile>
            <Tile label="error" className="w-[358px]">
                <FieldWord number={2} value="cabbage" onChange={() => {}} error />
            </Tile>
        </Section>
    );
};

const ChainChipShowcase = () => (
    <Section title="ChainChip">
        <Tile label="Ethereum">
            <ChainChip label="Ethereum" />
        </Tile>
        <Tile label="Base">
            <ChainChip label="Base" />
        </Tile>
        <Tile label="Tron">
            <ChainChip label="Tron" />
        </Tile>
        <Tile label="BSC">
            <ChainChip label="BNB Smart Chain" />
        </Tile>
        <Tile label="Arbitrum">
            <ChainChip label="Arbitrum" />
        </Tile>
    </Section>
);

const DASHBOARD_ROWS = ['Address', 'Jettons balance', 'Received August', 'Sent August'];

const ModalShowcase = () => {
    const [open, setOpen] = useState<'alert' | 'content' | 'nested' | null>(null);
    const close = () => setOpen(null);
    return (
        <Section title="Modal">
            <Tile label="alert — sized to content">
                <Button variant="secondary" size="small" onClick={() => setOpen('alert')}>
                    Open
                </Button>
            </Tile>
            <Tile label="content — 624px or the viewport">
                <Button variant="secondary" size="small" onClick={() => setOpen('content')}>
                    Open
                </Button>
            </Tile>
            <Tile label="nested — pinned to the parent bottom edge">
                <Button variant="secondary" size="small" onClick={() => setOpen('nested')}>
                    Open
                </Button>
            </Tile>
            <Modal
                isOpen={open === 'alert'}
                onClose={close}
                heading="Disconnect Uniswap?"
                subheading="This will remove Uniswap’s access to your wallet. You can reconnect it anytime."
            >
                <ModalFooterPortal>
                    <ModalFooter>
                        <Button variant="destructive" size="large" fullWidth onClick={close}>
                            Disconnect
                        </Button>
                        <Button variant="secondary" size="large" fullWidth onClick={close}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </ModalFooterPortal>
            </Modal>
            <Modal
                isOpen={open === 'content' || open === 'nested'}
                onClose={close}
                variant="content"
                topBarTitle="Manage dashboard"
            >
                <div className="overflow-hidden rounded-medium bg-backgroundContent">
                    {DASHBOARD_ROWS.map((row, index) => (
                        <div key={row}>
                            {index > 0 && <div className="ml-4 h-[0.5px] bg-separatorCommon" />}
                            <div className="flex h-14 items-center px-4 text-label1 text-textPrimary">
                                {row}
                            </div>
                        </div>
                    ))}
                </div>
                <ModalFooterPortal>
                    <ModalFooter>
                        <Button variant="primaryBlue" size="large" fullWidth onClick={close}>
                            Save
                        </Button>
                    </ModalFooter>
                </ModalFooterPortal>
                <Modal
                    isOpen={open === 'nested'}
                    onClose={() => setOpen('content')}
                    heading="Price impact is too high"
                    subheading="Swap may be conducted at a rate that differs significantly from market prices."
                >
                    <ModalFooterPortal>
                        <ModalFooter>
                            <Button
                                variant="destructive"
                                size="large"
                                fullWidth
                                onClick={() => setOpen('content')}
                            >
                                Swap at the Changed Price
                            </Button>
                            <Button
                                variant="secondary"
                                size="large"
                                fullWidth
                                onClick={() => setOpen('content')}
                            >
                                Back to Swap
                            </Button>
                        </ModalFooter>
                    </ModalFooterPortal>
                </Modal>
            </Modal>
        </Section>
    );
};

const SampleTokenIcon = () => <div className="h-11 w-11 rounded-full bg-backgroundContentTint" />;

const ChainBadgeOverlayShowcase = () => (
    <Section title="ChainBadgeOverlay">
        <Tile label="Native (no badge)">
            <ChainBadgeOverlay>
                <SampleTokenIcon />
            </ChainBadgeOverlay>
        </Tile>
        <Tile label="TON">
            <ChainBadgeOverlay icon={<IcChainTon20 />}>
                <SampleTokenIcon />
            </ChainBadgeOverlay>
        </Tile>
        <Tile label="Ethereum">
            <ChainBadgeOverlay icon={<IcChainEth20 />}>
                <SampleTokenIcon />
            </ChainBadgeOverlay>
        </Tile>
        <Tile label="Bitcoin">
            <ChainBadgeOverlay icon={<IcChainBtc20 />}>
                <SampleTokenIcon />
            </ChainBadgeOverlay>
        </Tile>
        <Tile label="Base">
            <ChainBadgeOverlay icon={<IcChainBase20 />}>
                <SampleTokenIcon />
            </ChainBadgeOverlay>
        </Tile>
        <Tile label="Arbitrum">
            <ChainBadgeOverlay icon={<IcChainArb20 />}>
                <SampleTokenIcon />
            </ChainBadgeOverlay>
        </Tile>
        <Tile label="BSC">
            <ChainBadgeOverlay icon={<IcChainBsc20 />}>
                <SampleTokenIcon />
            </ChainBadgeOverlay>
        </Tile>
        <Tile label="Tron">
            <ChainBadgeOverlay icon={<IcChainTron20 />}>
                <SampleTokenIcon />
            </ChainBadgeOverlay>
        </Tile>
    </Section>
);

const TokenSwitchShowcase = () => (
    <Section title="TokenSwitch">
        <Tile label="Native (no badge)">
            <TokenSwitch icon={<IcChainTon20 />} symbol="TON" />
        </Tile>
        <Tile label="Token w/ chain badge">
            <TokenSwitch icon={<SampleTokenIcon />} chainBadge={<IcChainEth20 />} symbol="SHIB" />
        </Tile>
    </Section>
);

export const UiShowcase: FC = () => (
    <div className="min-h-screen w-full overflow-auto bg-backgroundPage px-10 py-8 text-textPrimary">
        <h1 className="mb-2 text-h2">UI Kit Showcase</h1>
        <p className="mb-4 text-body2 text-textSecondary">
            Every primitive from <code className="text-body2">packages/uikit/src/primitives</code>{' '}
            with its key variants. DEV-only.
        </p>
        <ButtonShowcase />
        <LinkShowcase />
        <LoaderShowcase />
        <ToastShowcase />
        <IconButtonShowcase />
        <AddRemoveButtonShowcase />
        <CheckboxShowcase />
        <SwitchShowcase />
        <InputShowcase />
        <SearchFieldShowcase />
        <FieldWordShowcase />
        <ChainChipShowcase />
        <ChainBadgeOverlayShowcase />
        <TokenSwitchShowcase />
        <ModalShowcase />
    </div>
);

export default UiShowcase;
