import { HistoryEvent } from './HistoryEvent';
import { SpinnerRing } from '../../Icon';
import React, { FC, useState } from 'react';
import styled from 'styled-components';
import { GenericActivity } from '../../../state/activity';
import { MixedActivity } from '../../../state/mixedActivity';
import { ActionData, ActivityNotification } from '../../activity/ton/ActivityNotification';

const HistoryEventsGrid = styled.div<{ withBorder?: boolean }>`
    display: grid;
    grid-template-columns: 132px fit-content(256px) fit-content(256px) minmax(40px, 1fr);
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

export const DesktopHistory: FC<{
    activity: GenericActivity<MixedActivity>[] | undefined;
    isFetchingNextPage: boolean;
    className?: string;
}> = ({ activity, isFetchingNextPage, className }) => {
    const [selectedActivity, setSelectedActivity] = useState<ActionData | undefined>();

    return (
        <>
            <ActivityNotification
                value={selectedActivity}
                handleClose={() => setSelectedActivity(undefined)}
            />
            {activity && (
                <HistoryEventsGrid className={className}>
                    <GridSizer />
                    <GridSizer2 />
                    <GridSizer3 />
                    <GridSizer />
                    {activity.map(item => (
                        <HistoryEvent
                            item={item}
                            key={item.key}
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
