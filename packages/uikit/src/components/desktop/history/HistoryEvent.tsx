import { MixedActivity } from '../../../state/mixedActivity';
import { FC, useState, MouseEvent } from 'react';
import styled from 'styled-components';
import { GenericActivity, GroupedActivityItem } from '../../../state/activity';
import { Body2 } from '../../Text';
import { useDateTimeFormatFromNow } from '../../../hooks/useDateTimeFormat';
import { HistoryAction } from './ton/HistoryAction';
import { HistoryGridCell } from './ton/HistoryGrid';
import { ChevronDownIcon, SpinnerRing } from '../../Icon';
import { useTranslation } from '../../../hooks/translation';
import { ActionData } from '../../activity/ton/ActivityNotification';
import { IconButtonTransparentBackground } from '../../fields/IconButton';

const EventDivider = styled.div`
    background-color: ${p => p.theme.separatorCommon};
    height: 1px;
    grid-column: 1/-1;
    margin: 0 -1rem;
`;

const HistoryDateCell = styled(HistoryGridCell)`
    display: flex;
    align-items: center;
    color: ${p => p.theme.textSecondary};
`;

const PendingEventCell = styled(HistoryGridCell)`
    display: flex;
    align-items: center;
    gap: 6px;

    > ${Body2} {
        color: ${p => p.theme.textSecondary};
    }
`;

const HistoryEventWrapper = styled.div`
    display: contents;
    cursor: pointer;
`;

const ChevronUpIcon = styled(ChevronDownIcon)`
    transform: rotate(180deg);
`;

const GroupItemLeftSpacer = styled.div`
    width: 20px;
    flex-shrink: 0;
`;

export const HistoryEvent: FC<{
    group: GroupedActivityItem;
    onActionClick: (actionData: ActionData) => void;
}> = ({ group, onActionClick }) => {
    if (group.type === 'single') {
        return <HistoryEventSingle item={group.item} onActionClick={onActionClick} />;
    }

    return <HistoryEventGroup items={group.items} onActionClick={onActionClick} />;
};

const HistoryEventSingle: FC<{
    item: GenericActivity<MixedActivity>;
    onActionClick: (actionData: ActionData) => void;
    onCollapse?: () => void;
    onExpand?: () => void;
    isGroupItem?: boolean;
}> = ({ item, onActionClick, onCollapse, onExpand, isGroupItem }) => {
    const formattedDate = useDateTimeFormatFromNow(item.timestamp);
    const { t } = useTranslation();

    if (item.event.kind === 'tron') {
        return null;
    }

    const event = item.event.event;

    const handleChevronClick = (e: MouseEvent<HTMLButtonElement>) => {
        onExpand?.();
        onCollapse?.();
        e.stopPropagation();
        e.preventDefault();
    };

    const hasButton = Boolean(onCollapse || onExpand);
    isGroupItem ||= hasButton;

    return (
        <>
            {event.actions.map((action, index) => (
                // eslint-disable-next-line react/jsx-key
                <HistoryEventWrapper
                    onClick={() =>
                        onExpand
                            ? onExpand()
                            : onActionClick({
                                  timestamp: item.timestamp,
                                  action,
                                  isScam: event.isScam,
                                  event
                              })
                    }
                >
                    {index === 0 ? (
                        event.inProgress ? (
                            <PendingEventCell>
                                {isGroupItem &&
                                    (hasButton ? (
                                        <IconButtonTransparentBackgroundStyled
                                            onClick={handleChevronClick}
                                        >
                                            {onExpand ? <ChevronDownIcon /> : <ChevronUpIcon />}
                                        </IconButtonTransparentBackgroundStyled>
                                    ) : (
                                        <GroupItemLeftSpacer />
                                    ))}
                                <SpinnerRing />
                                <Body2>{t('transaction_type_pending') + '…'}</Body2>
                            </PendingEventCell>
                        ) : (
                            <HistoryDateCell>
                                {isGroupItem &&
                                    (hasButton ? (
                                        <IconButtonTransparentBackgroundStyled
                                            onClick={handleChevronClick}
                                        >
                                            {onExpand ? <ChevronDownIcon /> : <ChevronUpIcon />}
                                        </IconButtonTransparentBackgroundStyled>
                                    ) : (
                                        <GroupItemLeftSpacer />
                                    ))}
                                <Body2>{formattedDate}</Body2>
                            </HistoryDateCell>
                        )
                    ) : (
                        <HistoryDateCell />
                    )}
                    <HistoryAction
                        action={action}
                        isScam={event.isScam}
                        date={event.timestamp.toString()}
                    />
                    {index === event.actions.length - 1 && <EventDivider />}
                </HistoryEventWrapper>
            ))}
        </>
    );
};

const IconButtonTransparentBackgroundStyled = styled(IconButtonTransparentBackground)`
    margin-left: -1rem;
    flex-shrink: 0;
`;

const HistoryEventGroup: FC<{
    items: GenericActivity<MixedActivity>[];
    onActionClick: (actionData: ActionData) => void;
}> = ({ items, onActionClick }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (isExpanded) {
        return (
            <>
                {items.map((item, index) => (
                    <HistoryEventSingle
                        item={item}
                        onActionClick={onActionClick}
                        key={item.key}
                        onCollapse={index === 0 ? () => setIsExpanded(false) : undefined}
                        isGroupItem
                    />
                ))}
            </>
        );
    }

    return (
        <HistoryEventSingle
            item={items[0]}
            onActionClick={onActionClick}
            onExpand={() => setIsExpanded(true)}
        />
    );
};
