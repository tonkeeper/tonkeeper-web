import { TronWalletState } from '@tonkeeper/core/dist/entries/wallet';
import React, { FC, useEffect, useRef } from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { InnerBody } from '../../components/Body';
import { CoinSkeletonPage } from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { CoinInfo } from '../../components/jettons/Info';
import { useWalletContext } from '../../hooks/appContext';
import { AppRoute } from '../../libs/routes';
import { useTronStateMigration } from '../../state/tron';

const TronAsset: FC<{ tron: TronWalletState }> = ({ tron }) => {
  const { address } = useParams();

  console.log(tron);

  const ref = useRef<HTMLDivElement>(null);

  return (
    <>
      <SubHeader title={address} />
      <InnerBody ref={ref}>
        <CoinInfo
          amount={'0'}
          symbol="TON"
          price={'0'}
          image="/img/toncoin.svg"
        />
        {/* <HomeActions />
      
              {!isFetched ? (
                <CoinHistorySkeleton />
              ) : (
                <HistoryBlock>
                  <ActivityGroupRaw items={activity} />
                  {isFetchingNextPage && <SkeletonList size={3} />}
                </HistoryBlock>
              )} */}
      </InnerBody>
    </>
  );
};

const MigrateState = () => {
  const { mutateAsync } = useTronStateMigration();
  const navigate = useNavigate();

  useEffect(() => {
    mutateAsync().catch(() => {
      navigate(AppRoute.home);
    });
  });

  return <CoinSkeletonPage />;
};

export const TronPage = () => {
  const wallet = useWalletContext();
  if (wallet.tron) {
    return (
      <Routes>
        <Route path=":address" element={<TronAsset tron={wallet.tron} />} />
      </Routes>
    );
  } else {
    return <MigrateState />;
  }
};
