import { NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import React, { FC, useState } from 'react';
import { ActivityGroup } from '../../../state/ton/tonActivity';
import { ListItem } from '../../List';
import { NftNotification } from '../../nft/NftNotification';
import { ActivityAction } from '../ActivityAction';
import { ActivityBlock, ProgressIcon } from '../ActivityLayout';
import { ActionData, ActivityNotification } from '../ActivityNotification';

export const ActivityGroupRaw: FC<{
    items: ActivityGroup[];
}> = ({ items }) => {
    const [activity, setActivity] = useState<ActionData | undefined>(undefined);
    const [nft, setNft] = useState<NftItemRepr | undefined>(undefined);

    return (
        <>
            <ActivityBlock
                groups={items}
                RenderItem={({ event, date, timestamp }) => {
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
                                        isScam={event.isScam}
                                        date={date}
                                        openNft={setNft}
                                    />
                                    {event.inProgress && <ProgressIcon />}
                                </ListItem>
                            ))}
                        </>
                    );
                }}
            />
            <ActivityNotification value={activity} handleClose={() => setActivity(undefined)} />
            <NftNotification nftItem={nft} handleClose={() => setNft(undefined)} />
        </>
    );
};
