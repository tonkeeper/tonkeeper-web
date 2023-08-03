import { TronEvent } from '@tonkeeper/core/dist/tronApi';
import React, { FC } from 'react';
import { GenericActivityGroup } from '../../../state/activity';
import { ListItem } from '../../List';
import { ActivityBlock, ProgressIcon } from '../ActivityLayout';
import { TronActivityAction } from './TronActivityAction';

export const TronActivityGroup: FC<{
    items: GenericActivityGroup<TronEvent>[];
}> = ({ items }) => {
    return (
        <ActivityBlock
            groups={items}
            RenderItem={({ event, date, timestamp }) => {
                return (
                    <>
                        {event.actions.map((action, index) => (
                            <ListItem
                                key={index}
                                onClick={
                                    () => {}
                                    // setActivity({
                                    //     isScam: event.isScam,
                                    //     action,
                                    //     timestamp: timestamp,
                                    //     event
                                    // })
                                }
                            >
                                <TronActivityAction action={action} date={date} />
                                {event.inProgress && <ProgressIcon />}
                            </ListItem>
                        ))}
                    </>
                );
            }}
        />
    );
};
