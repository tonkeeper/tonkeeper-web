import { NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import React, { FC, useState } from 'react';
import styled from 'styled-components';
import { ActivityAction } from '../../components/activity/ActivityAction';
import { ListBlock, ListItem } from '../../components/List';
import { H3 } from '../../components/Text';
import { useTranslation } from '../../hooks/translation';
import {
  ActivityGroup,
  formatActivityDate,
  getActivityTitle,
} from '../../state/activity';
import { NftNotification } from '../nft/NftNotification';
import { ActionData, ActivityNotification } from './ActivityNotification';

const Group = styled.div`
  margin-bottom: 1.875rem;
`;
const List = styled(ListBlock)`
  margin: 0.5rem 0;
`;

const Title = styled(H3)`
  margin: 0 0 0.875rem;
  user-select: none;
`;

export const ActivityGroupRaw: FC<{
  items: ActivityGroup[];
}> = ({ items }) => {
  const { t, i18n } = useTranslation();
  const [activity, setActivity] = useState<ActionData | undefined>(undefined);
  const [nft, setNft] = useState<NftItemRepr | undefined>(undefined);

  return (
    <>
      {items.map(([key, events]) => {
        return (
          <Group key={key}>
            <Title>
              {getActivityTitle(i18n.language, key, events[0].timestamp)}
            </Title>
            {events.map(({ timestamp, event }) => {
              const date = formatActivityDate(i18n.language, key, timestamp);
              return (
                <List key={event.eventId}>
                  {event.actions.map((action, index) => (
                    <ListItem
                      key={index}
                      onClick={() =>
                        setActivity({
                          action,
                          timestamp: timestamp * 1000,
                          event,
                        })
                      }
                    >
                      <ActivityAction
                        action={action}
                        date={date}
                        openNft={setNft}
                      />
                    </ListItem>
                  ))}
                </List>
              );
            })}
          </Group>
        );
      })}
      <ActivityNotification
        value={activity}
        handleClose={() => setActivity(undefined)}
      />
      <NftNotification nftItem={nft} handleClose={() => setNft(undefined)} />
    </>
  );
};
