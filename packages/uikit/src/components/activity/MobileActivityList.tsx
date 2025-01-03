import React, { FC, useMemo, useState } from 'react';
import {
    formatActivityDate,
    getActivityTitle,
    ActivityItem,
    groupActivityItems
} from '../../state/activity';
import { Group, List, Title } from './ActivityLayout';
import { ActivityNotification, ActivityNotificationData } from './ton/ActivityNotification';
import { TonActivityEvents } from './ton/TonActivityEvents';
import { useTranslation } from '../../hooks/translation';
import { TronActivityEvents } from './tron/TronActivityEvents';

export const MobileActivityList: FC<{
    items: ActivityItem[];
}> = ({ items }) => {
    const [activityNotificationData, setActivityNotificationData] = useState<
        ActivityNotificationData | undefined
    >(undefined);
    const { i18n } = useTranslation();

    const groups = useMemo(() => groupActivityItems(items), [items]);

    return (
        <>
            {groups.map(([groupKey, groupEvents]) => {
                return (
                    <Group key={groupKey}>
                        <Title>
                            {getActivityTitle(i18n.language, groupKey, groupEvents[0].timestamp)}
                        </Title>
                        {groupEvents.map(({ timestamp, event, type, key }) => {
                            const date = formatActivityDate(i18n.language, groupKey, timestamp);
                            return (
                                <List key={key}>
                                    {type === 'tron' ? (
                                        <TronActivityEvents
                                            event={event}
                                            formattedDate={date}
                                            onClick={() =>
                                                setActivityNotificationData({
                                                    type: 'tron',
                                                    event,
                                                    timestamp: event.timestamp
                                                })
                                            }
                                        />
                                    ) : type === 'ton' ? (
                                        <TonActivityEvents
                                            event={event}
                                            date={date}
                                            timestamp={timestamp}
                                            setActivity={ad =>
                                                setActivityNotificationData({
                                                    type: 'ton',
                                                    ...ad
                                                })
                                            }
                                        />
                                    ) : null}
                                </List>
                            );
                        })}
                    </Group>
                );
            })}
            <ActivityNotification
                value={activityNotificationData}
                handleClose={() => setActivityNotificationData(undefined)}
            />
        </>
    );
};
