import { NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import React, { FC, useState } from 'react';
import styled from 'styled-components';
import { ListBlock, ListItem } from '../../components/List';
import { H3 } from '../../components/Text';
import { ActivityAction } from '../../components/activity/ActivityAction';
import { useTranslation } from '../../hooks/translation';
import {
  ActivityGroup,
  formatActivityDate,
  getActivityTitle,
} from '../../state/activity';
import { ClockIcon } from '../Icon';
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

const ProgressIcon = styled.div`
  position: absolute;
  left: 45px;
  top: 45px;
  color: ${(props) => props.theme.iconSecondary};
  padding: 0 !important;
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
                          isScam: event.isScam,
                          action,
                          timestamp: timestamp * 1000,
                          event,
                        })
                      }
                    >
                      <ActivityAction
                        action={action}
                        isScam={event.isScam}
                        date={date}
                        openNft={setNft}
                      />
                      {event.inProgress && (
                        <ProgressIcon>
                          <ClockIcon />
                        </ProgressIcon>
                      )}
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
