import { useInfiniteQuery } from '@tanstack/react-query';
import { JettonApi, JettonBalance } from '@tonkeeper/core/dist/tonApiV1';
import { JettonInfo } from '@tonkeeper/core/dist/tonApiV2';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import React, { FC, useMemo } from 'react';
import { Address } from 'ton-core';
import { InnerBody } from '../../components/Body';
import { CoinHistorySkeleton, CoinSkeletonPage, HistoryBlock } from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { ActivityGroupRaw } from '../../components/activity/ton/TonActivityGroup';
import { ActionsRow } from '../../components/home/Actions';
import { ReceiveAction } from '../../components/home/ReceiveAction';
import { CoinInfo } from '../../components/jettons/Info';
import { SendAction } from '../../components/transfer/SendNotifications';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { JettonKey, QueryKey } from '../../libs/queryKey';
import { useJettonBalance, useJettonInfo } from '../../state/jetton';
import { useFormatFiat, useRate } from '../../state/rates';
import {
    ActivityGroup,
    groupActivity,
    groupAndFilterJettonActivityItems
} from '../../state/ton/tonActivity';

const JettonHistory: FC<{ info: JettonInfo; balance: JettonBalance }> = ({ balance }) => {
    const { tonApi } = useAppContext();
    const wallet = useWalletContext();

    const { data } = useInfiniteQuery({
        queryKey: [balance.walletAddress.address, QueryKey.activity, JettonKey.history],
        queryFn: () =>
            new JettonApi(tonApi).getJettonHistory({
                account: wallet.active.rawAddress,
                jettonMaster: balance.walletAddress.address,
                limit: 200
                // beforeLt: pageParam,
            }),
        getNextPageParam: lastPage => lastPage.nextFrom
    });

    const items = useMemo<ActivityGroup[]>(() => {
        return data
            ? groupActivity(groupAndFilterJettonActivityItems(data, wallet.active.rawAddress))
            : [];
    }, [data, wallet.active.rawAddress]);

    if (items.length === 0) {
        return <CoinHistorySkeleton />;
    }

    return (
        <HistoryBlock>
            <ActivityGroupRaw items={items} />
        </HistoryBlock>
    );
};

const JettonHeader: FC<{ info: JettonInfo; balance: JettonBalance }> = ({ info, balance }) => {
    const [amount, address] = useMemo(
        () => [
            formatDecimals(balance.balance, info.metadata.decimals),
            Address.parse(balance.jettonAddress).toString()
        ],
        [info, balance]
    );

    const { data } = useRate(address);
    const { fiatPrice, fiatAmount } = useFormatFiat(data, amount);
    const { description, image } = info.metadata;

    return (
        <CoinInfo
            amount={amount}
            symbol={info.metadata.symbol}
            price={fiatAmount}
            description={description}
            image={image}
        />
    );
};

export const JettonContent: FC<{ jettonAddress: string }> = ({ jettonAddress }) => {
    const { data: info } = useJettonInfo(jettonAddress);
    const { data: balance } = useJettonBalance(jettonAddress);

    if (!info || !balance) {
        return <CoinSkeletonPage />;
    }

    return (
        <>
            <SubHeader title={info.metadata.name} />
            <InnerBody>
                <JettonHeader balance={balance} info={info} />
                <ActionsRow>
                    <SendAction asset={info.metadata.address} />
                    <ReceiveAction info={info} />
                </ActionsRow>

                <JettonHistory info={info} balance={balance} />
            </InnerBody>
        </>
    );
};
