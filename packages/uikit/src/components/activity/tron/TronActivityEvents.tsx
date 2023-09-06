import { TronEvent } from '@tonkeeper/core/dist/tronApi';
import React, { FC } from 'react';
import { ListItem } from '../../List';
import { ProgressIcon } from '../ActivityLayout';
import { TronActionData } from './ActivityNotification';
import { TronActivityAction } from './TronActivityAction';

export const TronActivityEvents: FC<{
    event: TronEvent;
    date: string;
    timestamp: number;
    setTronAction: (value: TronActionData) => void;
}> = ({ event, date, timestamp, setTronAction }) => {
    return (
        <>
            {event.actions.map((action, index) => (
                <ListItem
                    key={index}
                    onClick={() =>
                        setTronAction({
                            action,
                            timestamp: timestamp,
                            event
                        })
                    }
                >
                    <TronActivityAction action={action} date={date} />
                    {event.inProgress && <ProgressIcon />}
                </ListItem>
            ))}
        </>
    );
};
