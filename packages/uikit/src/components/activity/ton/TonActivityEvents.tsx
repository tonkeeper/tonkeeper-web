import { NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import { AccountEvent } from '@tonkeeper/core/dist/tonApiV2';
import React, { FC } from 'react';
import { ListItem } from '../../List';
import { ProgressIcon } from '../ActivityLayout';
import { ActionData } from '../ActivityNotification';
import { ActivityAction } from './TonActivityAction';

export const TonActivityEvents: FC<{
    event: AccountEvent;
    date: string;
    timestamp: number;
    setActivity: (item: ActionData) => void;
    setNft: (nft: NftItemRepr) => void;
}> = ({ event, date, timestamp, setActivity, setNft }) => {
    return (
        <>
            {event.actions.map((action, index) => (
                <ListItem
                    key={index}
                    onClick={() =>
                        setActivity({
                            isScam: event.isScam,
                            action,
                            timestamp: timestamp,
                            event
                        })
                    }
                >
                    <ActivityAction
                        action={action}
                        date={date}
                        isScam={event.isScam}
                        openNft={setNft}
                    />
                    {event.inProgress && <ProgressIcon />}
                </ListItem>
            ))}
        </>
    );
};
