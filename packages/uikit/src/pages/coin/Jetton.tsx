import { Address } from '@ton/core';
import {
    jettonToTonAssetAmount,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { JettonBalance, JettonInfo } from '@tonkeeper/core/dist/tonApiV2';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import React, { FC, Suspense, useMemo, useRef } from 'react';
import { InnerBody } from '../../components/Body';
import {
    ActivitySkeletonPage,
    CoinSkeletonPage,
    SkeletonListWithImages
} from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { MobileActivityList } from '../../components/activity/MobileActivityList';
import { ActionsRow } from '../../components/home/Actions';
import { ReceiveAction } from '../../components/home/ReceiveAction';
import { SwapAction } from '../../components/home/SwapAction';
import { CoinInfo } from '../../components/jettons/Info';
import { SendAction } from '../../components/transfer/SendActionButton';
import { useAppContext } from '../../hooks/appContext';
import { useFormatBalance } from '../../hooks/balance';
import { useFetchNext } from '../../hooks/useFetchNext';
import { useJettonBalance, useJettonInfo } from '../../state/jetton';
import { useFormatFiat, useRate } from '../../state/rates';
import { useAllSwapAssets } from '../../state/swap/useSwapAssets';
import { useIsActiveWalletWatchOnly } from '../../state/wallet';
import { useFetchFilteredActivity, useScrollMonitor } from '../../state/activity';
import EmptyActivity from '../../components/activity/EmptyActivity';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { IfFeatureEnabled } from '../../components/shared/IfFeatureEnabled';
import { FLAGGED_FEATURE } from '../../state/tonendpoint';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { KNOWN_TON_ASSETS } from '@tonkeeper/core/dist/entries/crypto/asset/constants';

export const MobileAssetHistory: FC<{
    assetAddress: string;
    innerRef: React.RefObject<HTMLDivElement>;
}> = ({ assetAddress, innerRef }) => {
    const { standalone } = useAppContext();

    const {
        refetch,
        isFetched: isActivityFetched,
        fetchNextPage: fetchActivityNextPage,
        hasNextPage: hasActivityNextPage,
        isFetchingNextPage: isActivityFetchingNextPage,
        data: activity
    } = useFetchFilteredActivity(assetAddress);

    useScrollMonitor(refetch, 5000, innerRef);

    const isFetchingNextPage = isActivityFetchingNextPage;

    useFetchNext(
        hasActivityNextPage,
        isFetchingNextPage,
        fetchActivityNextPage,
        standalone,
        innerRef
    );

    if (!isActivityFetched || !activity) {
        return <ActivitySkeletonPage />;
    }

    if (activity.length === 0) {
        return (
            <Suspense fallback={<ActivitySkeletonPage />}>
                <EmptyActivity />
            </Suspense>
        );
    }

    return (
        <>
            <MobileActivityList items={activity} />
            {isFetchingNextPage && <SkeletonListWithImages size={3} />}
        </>
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
    const assetAmount = jettonToTonAssetAmount(balance);

    return (
        <CoinInfo
            amount={total}
            symbol={info.metadata.symbol}
            price={fiatAmount}
            description={description}
            image={assetAmount.image ?? image}
            noImageCorners={assetAmount.asset.noImageCorners}
        />
    );
};

export const JettonContent: FC<{ jettonAddress: string }> = ({ jettonAddress }) => {
    const { data: info } = useJettonInfo(jettonAddress);
    const { data: balance } = useJettonBalance(jettonAddress);
    const isReadOnly = useIsActiveWalletWatchOnly();
    const { data: swapAssets } = useAllSwapAssets();

    const address = Address.parse(jettonAddress);
    const jettonAddressRaw = address.toRawString();
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
                    <IfFeatureEnabled feature={FLAGGED_FEATURE.SWAPS}>
                        <IfFeatureEnabled
                            feature={FLAGGED_FEATURE.ETHENA}
                            applied={eqAddresses(address, KNOWN_TON_ASSETS.USDe)}
                        >
                            {swapAsset && <SwapAction fromAsset={swapAsset} />}
                        </IfFeatureEnabled>
                    </IfFeatureEnabled>
                </ActionsRow>

                <MobileAssetHistory assetAddress={balance.jetton.address} innerRef={ref} />
            </InnerBody>
        </>
    );
};
