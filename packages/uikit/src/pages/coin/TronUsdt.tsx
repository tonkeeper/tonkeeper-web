import React, { FC, useRef } from 'react';
import { InnerBody } from '../../components/Body';
import { CoinSkeletonPage } from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { Action, ActionsRow } from '../../components/home/Actions';
import { CoinInfo } from '../../components/jettons/Info';
import { TokenRate, useFormatFiat } from '../../state/rates';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import { useTronBalances } from '../../state/tron/tron';
import { ReceiveIcon, SendIcon } from '../../components/home/HomeIcons';
import { useAppSdk } from '../../hooks/appSdk';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { useSendTransferNotification } from '../../components/modals/useSendTransferNotification';
import { MobileAssetHistory } from './Jetton';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';

const usdtRate: TokenRate = {
    prices: 1,
    diff7d: '',
    diff24h: ''
};

const TronUsdtHeader: FC<{ assetAmount: AssetAmount<TronAsset> }> = ({ assetAmount }) => {
    const { fiatAmount } = useFormatFiat(usdtRate, assetAmount.relativeAmount);

    return (
        <CoinInfo
            amount={assetAmount.stringRelativeAmount}
            symbol={assetAmount.asset.symbol}
            price={fiatAmount}
            image={assetAmount.asset.image}
            imageNoCorners
        />
    );
};

export const TronUsdtContent = () => {
    const balance = useTronBalances().data?.usdt;
    const ref = useRef<HTMLDivElement>(null);
    const sdk = useAppSdk();
    const { onOpen } = useSendTransferNotification();

    if (balance === undefined) {
        return <CoinSkeletonPage />;
    }

    return (
        <>
            <SubHeader title={balance.asset.name} />
            <InnerBody ref={ref}>
                <TronUsdtHeader assetAmount={balance} />
                <ActionsRow>
                    <Action
                        icon={<SendIcon />}
                        title={'wallet_send'}
                        action={() => onOpen({ chain: BLOCKCHAIN_NAME.TRON })}
                    />
                    <Action
                        icon={<ReceiveIcon />}
                        title={'wallet_receive'}
                        action={() =>
                            sdk.uiEvents.emit('receive', {
                                method: 'receive',
                                params: {
                                    chain: BLOCKCHAIN_NAME.TRON,
                                    jetton: balance.asset.id
                                }
                            })
                        }
                    />
                </ActionsRow>

                <MobileAssetHistory assetAddress={TRON_USDT_ASSET.address} innerRef={ref} />
            </InnerBody>
        </>
    );
};
