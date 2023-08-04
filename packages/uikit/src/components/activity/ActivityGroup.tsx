import { NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import React, { FC, useState } from 'react';
import { GenericActivityGroup } from '../../state/activity';
import { MixedActivity } from '../../state/mixedActivity';
import { NftNotification } from '../nft/NftNotification';
import { ActivityBlock } from './ActivityLayout';
import { ActionData, ActivityNotification } from './ActivityNotification';
import { TonActivityEvents } from './ton/TonActivityEvents';
import { TronActivityEvents } from './tron/TronActivityEvents';

export const MixedActivityGroup: FC<{
    items: GenericActivityGroup<MixedActivity>[];
}> = ({ items }) => {
    const [activity, setActivity] = useState<ActionData | undefined>(undefined);
    const [nft, setNft] = useState<NftItemRepr | undefined>(undefined);

    return (
        <>
            <ActivityBlock
                groups={items}
                RenderItem={({ event, date, timestamp }) => {
                    if (event.kind === 'tron') {
                        return (
                            <TronActivityEvents
                                event={event.event}
                                date={date}
                                timestamp={timestamp}
                            />
                        );
                    }
                    if (event.kind === 'ton') {
                        return (
                            <TonActivityEvents
                                event={event.event}
                                date={date}
                                timestamp={timestamp}
                                setActivity={setActivity}
                                setNft={setNft}
                            />
                        );
                    }
                    return <></>;
                }}
            />
            <ActivityNotification value={activity} handleClose={() => setActivity(undefined)} />
            <NftNotification nftItem={nft} handleClose={() => setNft(undefined)} />
        </>
    );
};
