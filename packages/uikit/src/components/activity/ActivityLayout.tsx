import React from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { GenericActivityGroup, formatActivityDate, getActivityTitle } from '../../state/activity';
import { ClockIcon } from '../Icon';
import { ListBlock } from '../List';
import { H3 } from '../Text';

export const Group = styled.div`
    margin-bottom: 1.875rem;
`;
export const List = styled(ListBlock)`
    margin: 0.5rem 0;
`;

export const Title = styled(H3)`
    margin: 0 0 0.875rem;
    user-select: none;
`;

export const ProgressWrapper = styled.div`
    position: absolute;
    left: 45px;
    top: 45px;
    color: ${props => props.theme.iconSecondary};
    padding: 0 !important;
`;

export const ProgressIcon = () => {
    return (
        <ProgressWrapper>
            <ClockIcon />
        </ProgressWrapper>
    );
};

export function ActivityBlock<T>({
    groups,
    RenderItem
}: {
    groups: GenericActivityGroup<T>[];
    RenderItem: (props: { event: T; date: string; timestamp: number }) => React.ReactElement;
}) {
    const { i18n } = useTranslation();
    return (
        <>
            {groups.map(([eventKey, events]) => {
                return (
                    <Group key={eventKey}>
                        <Title>
                            {getActivityTitle(i18n.language, eventKey, events[0].timestamp)}
                        </Title>
                        {events.map(({ timestamp, event, key }) => {
                            const date = formatActivityDate(i18n.language, eventKey, timestamp);
                            return (
                                <List key={key}>
                                    <RenderItem event={event} date={date} timestamp={timestamp} />
                                </List>
                            );
                        })}
                    </Group>
                );
            })}
        </>
    );
}
