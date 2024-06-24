import { HistoryEvent } from './HistoryEvent';
import { SpinnerRing } from '../../Icon';
import React, { FC, useMemo, useState } from 'react';
import styled from 'styled-components';
import { GenericActivity } from '../../../state/activity';
import { MixedActivity } from '../../../state/mixedActivity';
import { ActionData, ActivityNotification } from '../../activity/ton/ActivityNotification';

const HistoryEventsGrid = styled.div<{ withBorder?: boolean }>`
    display: grid;
    grid-template-columns: 152px fit-content(256px) fit-content(256px) minmax(40px, 1fr);
    column-gap: 8px;
    padding: 0 1rem;
`;

const GridSizer = styled.div`
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

const FetchingRows = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 36px;

    > div {
        transform: scale(1.25);
    }
`;

type GroupedActivityItemSingle = {
    type: 'single';
    item: GenericActivity<MixedActivity>;
    key: string;
};

type GroupedActivityItemGroup = {
    type: 'group';
    items: GenericActivity<MixedActivity>[];
    category: 'spam';
    key: string;
};

type GroupedActivity = (GroupedActivityItemSingle | GroupedActivityItemGroup)[];

export const DesktopHistory: FC<{
    activity: GenericActivity<MixedActivity>[] | undefined;
    isFetchingNextPage: boolean;
    className?: string;
}> = ({ activity, isFetchingNextPage, className }) => {
    const [selectedActivity, setSelectedActivity] = useState<ActionData | undefined>();

    const aggregatedActivity: GroupedActivity | undefined = useMemo(() => {
        const groupped = activity?.reduce((acc, item) => {
            if (item.event.kind === 'tron' || !item.event.event.isScam) {
                acc.push({
                    type: 'single',
                    item,
                    key: item.key
                });
                return acc;
            }

            if (acc.length > 0 && acc[acc.length - 1].type === 'group') {
                const group = acc[acc.length - 1] as GroupedActivityItemGroup;
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
        }, [] as GroupedActivity);

        return groupped?.map(i => {
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

    return (
        <>
            <ActivityNotification
                value={selectedActivity}
                handleClose={() => setSelectedActivity(undefined)}
            />
            {aggregatedActivity && (
                <HistoryEventsGrid className={className}>
                    <GridSizer />
                    <GridSizer2 />
                    <GridSizer3 />
                    <GridSizer />
                    {aggregatedActivity.map(group => (
                        <HistoryEvent
                            group={group}
                            key={group.key}
                            onActionClick={setSelectedActivity}
                        />
                    ))}
                </HistoryEventsGrid>
            )}
            {(isFetchingNextPage || !activity) && (
                <FetchingRows>
                    <SpinnerRing />
                </FetchingRows>
            )}
        </>
    );
};
