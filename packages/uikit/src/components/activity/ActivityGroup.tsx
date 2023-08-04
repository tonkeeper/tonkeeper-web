import React, { FC } from 'react';
import { GenericActivityGroup } from '../../state/activity';
import { MixedActivity } from '../../state/mixedActivity';
import { ActivityBlock } from './ActivityLayout';
import { TronActivityGroup } from './tron/TronActivityGroup';

export const MixedActivityGroup: FC<{
    items: GenericActivityGroup<MixedActivity>[];
}> = ({ items }) => {
    return (
        <ActivityBlock
            groups={items}
            RenderItem={({ event, date, timestamp }) => {
                if (event.kind === 'tron') {
                    return (
                        <TronActivityGroup event={event.event} date={date} timestamp={timestamp} />
                    );
                }

                return <></>;
            }}
        />
    );
};
