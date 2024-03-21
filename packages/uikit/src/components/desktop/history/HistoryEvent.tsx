import { MixedActivity } from '../../../state/mixedActivity';
import { FC } from 'react';
import styled, { css } from 'styled-components';
import { GenericActivity } from '../../../state/activity';
import { Body2 } from '../../Text';
import { useDateTimeFormatFromNow } from '../../../hooks/useDateTimeFormat';
import { HistoryAction } from './ton/HistoryAction';

const HistoryRowStyled = styled.div<{ withBorder?: boolean }>`
    display: grid;
    grid-template-rows: 1fr;
    grid-auto-rows: 0;
    grid-template-columns: 124px 1fr;
    gap: 8px;
    padding: 0.5rem 1rem;
    ${p =>
        p.withBorder &&
        css`
            border-bottom: 1px solid ${p.theme.separatorCommon};
        `}
    height: 20px;

    > *:first-child {
        color: ${p => p.theme.textSecondary};
    }
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
                <HistoryRowStyled withBorder={index === event.actions.length - 1}>
                    {index === 0 ? <Body2>{formattedDate}</Body2> : <div />}
                    <HistoryAction
                        action={action}
                        isScam={event.isScam}
                        date={event.timestamp.toString()}
                    />
                </HistoryRowStyled>
            ))}
        </>
    );
};
