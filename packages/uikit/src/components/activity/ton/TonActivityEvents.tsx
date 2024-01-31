import { AccountEvent } from '@tonkeeper/core/dist/tonApiV2';
import { FC } from 'react';
import { ListItem } from '../../List';
import { ProgressIcon } from '../ActivityLayout';
import { ActionData } from './ActivityNotification';
import { ActivityAction } from './TonActivityAction';

export const TonActivityEvents: FC<{
    event: AccountEvent;
    date: string;
    timestamp: number;
    hover?: boolean;
    setActivity: (item: ActionData) => void;
}> = ({ event, date, timestamp, setActivity, hover }) => {
    return (
        <>
            {event.actions.map((action, index) => (
                <ListItem
                    key={index}
                    hover={hover}
                    onClick={() =>
                        setActivity({
                            isScam: event.isScam,
                            action,
                            timestamp: timestamp,
                            event
                        })
                    }
                >
                    <ActivityAction action={action} date={date} isScam={event.isScam} />
                    {event.inProgress && <ProgressIcon />}
                </ListItem>
            ))}
        </>
    );
};
