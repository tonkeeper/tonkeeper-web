import {
    AddRemoveButton,
    BackButton,
    CloseButton,
    IconButton,
    Link,
    SkeletonScope
} from '@tonkeeper/ui-kit';
import IcPlus28 from '@tonkeeper/ui-kit/icons/IcPlus28';
import IcArrowUp28 from '@tonkeeper/ui-kit/icons/IcArrowUp28';
import IcArrowDown28 from '@tonkeeper/ui-kit/icons/IcArrowDown28';
import IcSwapHorizontal28 from '@tonkeeper/ui-kit/icons/IcSwapHorizontal28';
import { Cell, Cells, Group, Matrix, Page, noop } from '../kit';

export const LinkStory = () => (
    <Page
        title="Link"
        description="Inline accent text action. Fades to 80% on hover and press."
        importLine="import { Link } from '@tonkeeper/ui-kit'"
    >
        <Group title="States">
            <Cells>
                <Cell label="default">
                    <Link>Learn more</Link>
                </Cell>
                <Cell label="disabled">
                    <Link disabled>Learn more</Link>
                </Cell>
            </Cells>
        </Group>
        <Group title="In text">
            <p className="max-w-[420px] text-body2 text-textSecondary">
                Your recovery phrase is the only way to restore the wallet.{' '}
                <Link>Read the guide</Link>
            </p>
        </Group>
    </Page>
);

const ACTIONS = [
    { icon: <IcArrowUp28 />, label: 'Send' },
    { icon: <IcArrowDown28 />, label: 'Receive' },
    { icon: <IcSwapHorizontal28 />, label: 'Swap' },
    { icon: <IcPlus28 />, label: 'Buy' }
];

export const IconButtonStory = () => (
    <Page
        title="IconButton"
        description="72px-wide action: a round 44px chip with a caption, used for the wallet home actions. Takes any 28px icon."
        importLine="import { IconButton } from '@tonkeeper/ui-kit'"
    >
        <Group title="States">
            <Cells>
                <Cell label="default (hover to highlight)">
                    <IconButton icon={<IcArrowUp28 />} label="Send" onClick={noop} />
                </Cell>
                <Cell label="skeleton">
                    <SkeletonScope loading>
                        <IconButton icon={<IcArrowUp28 />} label="Send" />
                    </SkeletonScope>
                </Cell>
                <Cell label="long label wraps">
                    <IconButton icon={<IcPlus28 />} label="Buy and sell" onClick={noop} />
                </Cell>
            </Cells>
        </Group>
        <Group title="Action row">
            <div className="flex gap-2">
                {ACTIONS.map(a => (
                    <IconButton key={a.label} icon={a.icon} label={a.label} />
                ))}
            </div>
        </Group>
    </Page>
);

export const AddRemoveButtonStory = () => (
    <Page
        title="AddRemoveButton"
        description="24px round toggle for adding or removing an item from a list."
        importLine="import { AddRemoveButton } from '@tonkeeper/ui-kit'"
    >
        <Group title="Type × state">
            <Matrix
                rows={['add', 'remove'] as const}
                columns={['default', 'disabled'] as const}
                render={(type, state) => (
                    <AddRemoveButton type={type} disabled={state === 'disabled'} />
                )}
            />
        </Group>
    </Page>
);

export const HeaderButtonsStory = () => (
    <Page
        title="BackButton / CloseButton"
        description="32px header controls. Every screen with a way back and every modal header use these two."
        importLine="import { BackButton, CloseButton } from '@tonkeeper/ui-kit'"
    >
        <Group title="Figures">
            <Cells>
                <Cell label="BackButton">
                    <BackButton onClick={noop} />
                </Cell>
                <Cell label="CloseButton">
                    <CloseButton onClick={noop} />
                </Cell>
            </Cells>
        </Group>
        <Group title="In a header">
            <div className="flex h-16 max-w-[420px] items-center justify-between rounded-medium bg-backgroundPage px-4">
                <BackButton onClick={noop} />
                <span className="text-h3 text-textPrimary">Title</span>
                <CloseButton onClick={noop} />
            </div>
        </Group>
    </Page>
);
