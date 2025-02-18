import { HistoryEvent, HistoryGridTimeCell } from './HistoryEvent';
import { SpinnerRing } from '../../Icon';
import React, { FC, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
    ActivityItem,
    CategorizedActivity,
    CategorizedActivityItemGroup
} from '../../../state/activity';
import {
    ActivityNotification,
    ActivityNotificationData
} from '../../activity/ton/ActivityNotification';
import { Body2Class } from '../../Text';
import { useTranslation } from '../../../hooks/translation';

const ContainerQuery = styled.div`
    container-type: inline-size;
`;

const GridSizer1 = styled.div`
    height: 0;
`;

const GridSizer2 = styled.div`
    height: 0;
    min-width: 120px;
`;

const GridSizer3 = styled.div`
    height: 0;
    min-width: 120px;
`;

const GridSizer4 = styled.div`
    height: 0;
`;

const HistoryEventsGrid = styled.div<{ withBorder?: boolean }>`
    display: grid;
    grid-template-columns: 152px fit-content(256px) fit-content(256px) minmax(40px, 1fr);
    column-gap: 8px;
    padding: 0 1rem;

    @container (max-width: 800px) {
        grid-template-columns: fit-content(256px) fit-content(256px) minmax(40px, 1fr);

        ${HistoryGridTimeCell} {
            grid-column: 1 / -1;

            &:empty {
                display: none;
            }
        }

        ${GridSizer1} {
            grid-column: 1 / -1;
        }
    }
`;

const FetchingRows = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 36px;

    > div {
        transform: scale(1.25);
    }
`;

const HistoryEvents: FC<{
    className?: string;
    aggregatedActivity: CategorizedActivity;
    setSelectedActivity: React.Dispatch<React.SetStateAction<ActivityNotificationData | undefined>>;
}> = ({ className, aggregatedActivity, setSelectedActivity }) => {
    return (
        <ContainerQuery>
            <HistoryEventsGrid className={className}>
                <GridSizer1 />
                <GridSizer2 />
                <GridSizer3 />
                <GridSizer4 />
                {aggregatedActivity.map(group => (
                    <HistoryEvent
                        group={group}
                        key={group.key}
                        onActionClick={setSelectedActivity}
                    />
                ))}
            </HistoryEventsGrid>
        </ContainerQuery>
    );
};

const NoTransactionsYet = styled.div`
    padding: 24px 32px;
    ${Body2Class};
    color: ${p => p.theme.textSecondary};
    text-align: center;
`;

export const DesktopHistory: FC<{
    activity: ActivityItem[] | undefined;
    isFetchingNextPage: boolean;
    className?: string;
}> = ({ activity, isFetchingNextPage, className }) => {
    const { t } = useTranslation();
    const [selectedActivity, setSelectedActivity] = useState<
        ActivityNotificationData | undefined
    >();

    const aggregatedActivity: CategorizedActivity = useMemo(() => {
        const double = new Set();

        const groupped = (activity ?? []).reduce((acc, item) => {
            if (item.type === 'tron' || !item.event.isScam) {
                if (!double.has(item.key)) {
                    double.add(item.key);
                    acc.push({
                        type: 'single',
                        item,
                        key: item.key
                    });
                }
                return acc;
            }

            if (acc.length > 0 && acc[acc.length - 1].type === 'group') {
                const group = acc[acc.length - 1] as CategorizedActivityItemGroup;
                group.items.push(item);
                group.key = item.key;
                return acc;
            }

            acc.push({
                type: 'group',
                items: [item],
                key: item.key,
                category: 'spam'
            });

            return acc;
        }, [] as CategorizedActivity);

        return groupped.map(i => {
            if (i.type === 'group' && i.items.length === 1) {
                return {
                    type: 'single',
                    item: i.items[0],
                    key: i.key
                };
            }

            return i;
        });
    }, [activity]);

    const key = aggregatedActivity.length ? aggregatedActivity[0].key : undefined;
    if (activity && !activity.length) {
        return <NoTransactionsYet>{t('history_no_transactions_yet')}</NoTransactionsYet>;
    }

    return (
        <>
            <ActivityNotification
                value={selectedActivity}
                handleClose={() => setSelectedActivity(undefined)}
            />
            <HistoryEvents
                key={key}
                className={className}
                aggregatedActivity={aggregatedActivity}
                setSelectedActivity={setSelectedActivity}
            />
            {(isFetchingNextPage || !activity) && (
                <FetchingRows>
                    <SpinnerRing />
                </FetchingRows>
            )}
        </>
    );
};
