import { useInfiniteQuery } from '@tanstack/react-query';
import { EventApi } from '@tonkeeper/core/dist/tonApiV1';
import React, { FC, useMemo } from 'react';
import styled from 'styled-components';
import { ActivityGroupRaw } from '../../components/activity/ActivityGroup';
import { EmptyActivity } from '../../components/activity/EmptyActivity';
import { ActivityHeader } from '../../components/Header';
import { ActivitySkeleton, SkeletonList } from '../../components/Skeleton';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useFetchNext } from '../../hooks/useFetchNext';
import { QueryKey } from '../../libs/queryKey';
import {
  ActivityGroup,
  groupActivity,
  groupActivityItems,
} from '../../state/activity';

const Body = styled.div`
  flex-grow: 1;
  padding: 0 1rem;
`;

const Activity: FC = () => {
  const wallet = useWalletContext();
  const { tonApi } = useAppContext();

  const { fetchNextPage, hasNextPage, isFetchingNextPage, data, ...result } =
    useInfiniteQuery({
      queryKey: [wallet.active.rawAddress, QueryKey.activity],
      queryFn: ({ pageParam = undefined }) =>
        new EventApi(tonApi).accountEvents({
          account: wallet.active.rawAddress,
          limit: 20,
          beforeLt: pageParam,
        }),
      getNextPageParam: (lastPage) => lastPage.nextFrom,
    });

  useFetchNext(hasNextPage, isFetchingNextPage, fetchNextPage);

  const items = useMemo<ActivityGroup[]>(() => {
    return data ? groupActivity(groupActivityItems(data)) : [];
  }, [data]);

  if (!data) {
    return <ActivitySkeleton />;
  }

  if (items.length === 0) {
    return <EmptyActivity />;
  }

  return (
    <>
      <ActivityHeader />
      <Body>
        <ActivityGroupRaw items={items} />
        {isFetchingNextPage && <SkeletonList size={3} />}
      </Body>
    </>
  );
};

export default Activity;
