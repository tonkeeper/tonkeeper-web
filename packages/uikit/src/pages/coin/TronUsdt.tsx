import React, { FC, useRef } from 'react';
import { InnerBody } from '../../components/Body';
import { CoinSkeletonPage } from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { Action, ActionsRow } from '../../components/home/Actions';
import { CoinInfo } from '../../components/jettons/Info';
import { useFormatFiat, useUSDTRate } from '../../state/rates';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import { useTronBalances } from '../../state/tron/tron';
import { ReceiveIcon, SendIcon } from '../../components/home/HomeIcons';
import { useAppSdk } from '../../hooks/appSdk';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { useSendTransferNotification } from '../../components/modals/useSendTransferNotification';
import { MobileAssetHistory } from './Jetton';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { AssetBlockchainBadge } from '../../components/account/AccountBadge';
import styled from 'styled-components';

const TronUsdtHeader: FC<{ assetAmount: AssetAmount<TronAsset> }> = ({ assetAmount }) => {
    const { data: rate } = useUSDTRate();
    const { fiatAmount } = useFormatFiat(rate, assetAmount.relativeAmount);

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

const TRC20Title = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

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
            <SubHeader
                title={
                    <TRC20Title>
                        {balance.asset.name}
                        <AssetBlockchainBadge>TRC20</AssetBlockchainBadge>
                    </TRC20Title>
                }
            />
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
