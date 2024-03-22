import { MixedActivity } from '../../../state/mixedActivity';
import { FC } from 'react';
import styled from 'styled-components';
import { GenericActivity } from '../../../state/activity';
import { Body2 } from '../../Text';
import { useDateTimeFormatFromNow } from '../../../hooks/useDateTimeFormat';
import { HistoryAction } from './ton/HistoryAction';
import { HistoryGridCell } from './ton/HistoryGrid';

const EventDivider = styled.div`
    background-color: ${p => p.theme.separatorCommon};
    height: 1px;
    grid-column: 1/-1;
    margin: 0 -1rem;
`;

const HistoryDateCell = styled(HistoryGridCell)`
    color: ${p => p.theme.textSecondary};
`;

export const HistoryEvent: FC<{ item: GenericActivity<MixedActivity> }> = ({ item }) => {
    const formattedDate = useDateTimeFormatFromNow(item.timestamp);

    if (item.event.kind === 'tron') {
        return null;
    }

    const event = item.event.event;

    return (
        <>
            {event.actions.map((action, index) => (
                // eslint-disable-next-line react/jsx-key
                <>
                    {index === 0 ? (
                        <HistoryDateCell>
                            <Body2>{formattedDate}</Body2>
                        </HistoryDateCell>
                    ) : (
                        <HistoryDateCell />
                    )}
                    <HistoryAction
                        action={action}
                        isScam={event.isScam}
                        date={event.timestamp.toString()}
                    />
                    {index === event.actions.length - 1 && <EventDivider />}
                </>
            ))}
        </>
    );
};
