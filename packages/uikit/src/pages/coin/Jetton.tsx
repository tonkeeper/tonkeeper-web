import { useInfiniteQuery } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { tonAssetAddressToString } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { AccountsApi, JettonBalance, JettonInfo } from '@tonkeeper/core/dist/tonApiV2';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import React, { FC, useMemo, useRef } from 'react';
import { InnerBody } from '../../components/Body';
import { CoinSkeletonPage } from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { ActivityList } from '../../components/activity/ActivityGroup';
import { ActionsRow } from '../../components/home/Actions';
import { ReceiveAction } from '../../components/home/ReceiveAction';
import { SwapAction } from '../../components/home/SwapAction';
import { CoinInfo } from '../../components/jettons/Info';
import { SendAction } from '../../components/transfer/SendActionButton';
import { useAppContext } from '../../hooks/appContext';
import { useFormatBalance } from '../../hooks/balance';
import { useFetchNext } from '../../hooks/useFetchNext';
import { JettonKey, QueryKey } from '../../libs/queryKey';
import { useJettonBalance, useJettonInfo } from '../../state/jetton';
import { useFormatFiat, useRate } from '../../state/rates';
import { useAllSwapAssets } from '../../state/swap/useSwapAssets';
import { useActiveWallet, useIsActiveWalletWatchOnly } from '../../state/wallet';

const JettonHistory: FC<{ balance: JettonBalance; innerRef: React.RefObject<HTMLDivElement> }> = ({
    balance,
    innerRef
}) => {
    const { api, standalone } = useAppContext();
    const wallet = useActiveWallet();

    const { isFetched, hasNextPage, data, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
        queryKey: [balance.walletAddress.address, QueryKey.activity, JettonKey.history],
        queryFn: ({ pageParam = undefined }) =>
            new AccountsApi(api.tonApiV2).getAccountJettonHistoryByID({
                accountId: wallet.rawAddress,
                jettonId: balance.jetton.address,
                limit: 20,
                beforeLt: pageParam
            }),
        getNextPageParam: lastPage => (lastPage.nextFrom > 0 ? lastPage.nextFrom : undefined)
    });

    useFetchNext(hasNextPage, isFetchingNextPage, fetchNextPage, standalone, innerRef);

    return (
        <ActivityList
            isFetched={isFetched}
            isFetchingNextPage={isFetchingNextPage}
            tonEvents={data}
        />
    );
};

const JettonHeader: FC<{ info: JettonInfo; balance: JettonBalance }> = ({ info, balance }) => {
    const [amount, address] = useMemo(
        () => [
            formatDecimals(balance.balance, info.metadata.decimals),
            Address.parse(balance.jetton.address).toString()
        ],
        [info, balance]
    );

    const { data } = useRate(address);
    const total = useFormatBalance(amount, info.metadata.decimals);
    const { fiatAmount } = useFormatFiat(data, amount);
    const { description, image } = info.metadata;

    return (
        <CoinInfo
            amount={total}
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
    const isReadOnly = useIsActiveWalletWatchOnly();
    const { data: swapAssets } = useAllSwapAssets();

    const jettonAddressRaw = Address.parse(jettonAddress).toRawString();
    const swapAsset = isReadOnly
        ? undefined
        : swapAssets?.find(a => tonAssetAddressToString(a.address) === jettonAddressRaw);
    const ref = useRef<HTMLDivElement>(null);
    if (!info || !balance || !swapAssets) {
        return <CoinSkeletonPage />;
    }

    return (
        <>
            <SubHeader title={info.metadata.name} />
            <InnerBody ref={ref}>
                <JettonHeader balance={balance} info={info} />
                <ActionsRow>
                    {!isReadOnly && (
                        <SendAction asset={info.metadata.address} chain={BLOCKCHAIN_NAME.TON} />
                    )}
                    <ReceiveAction jetton={info.metadata.address} />
                    {swapAsset && <SwapAction fromAsset={swapAsset} />}
                </ActionsRow>

                <JettonHistory balance={balance} innerRef={ref} />
            </InnerBody>
        </>
    );
};
