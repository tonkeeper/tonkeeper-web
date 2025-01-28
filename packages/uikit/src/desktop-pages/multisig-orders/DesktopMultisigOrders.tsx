import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { Body2, Body2Class, Label2 } from '../../components/Text';
import { useIsScrolled } from '../../hooks/useIsScrolled';
import { useTranslation } from '../../hooks/translation';
import {
    useActiveMultisigWalletInfo,
    useIsActiveAccountMultisig,
    useMarkAccountOrdersAsViewed,
    useOrderInfo
} from '../../state/multisig';
import { SkeletonListDesktopAdaptive } from '../../components/Skeleton';
import React, { FC, useEffect, useMemo } from 'react';
import { Button } from '../../components/fields/Button';

import { styled } from 'styled-components';
import { useAppSdk, useAppTargetEnv } from '../../hooks/appSdk';
import { Multisig, type MultisigOrder, Risk } from '@tonkeeper/core/dist/tonApiV2';
import { AppRoute } from '../../libs/routes';
import { useSendTransferNotification } from '../../components/modals/useSendTransferNotification';
import { toTimeLeft } from '@tonkeeper/core/dist/utils/date';
import { ArrowUpIcon } from '../../components/Icon';
import { toNano } from '@ton/core';
import { useFormatCoinValue } from '../../hooks/balance';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { useMultisigOrderNotification } from '../../components/modals/MultisigOrderNotificationControlled';
import { formatAddress } from '@tonkeeper/core/dist/utils/common';
import { useDateTimeFormatFromNow } from '../../hooks/useDateTimeFormat';
import { orderStatus } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/multisig-encoder';
import { useActiveConfig } from '../../state/wallet';
import { Navigate } from '../../components/shared/Navigate';

const DesktopViewPageLayoutStyled = styled(DesktopViewPageLayout)`
    height: 100%;
`;

export const DesktopMultisigOrdersPage = () => {
    const { ref: scrollRef, closeTop } = useIsScrolled();
    const { t } = useTranslation();
    const isAccountMultisig = useIsActiveAccountMultisig();
    const env = useAppTargetEnv();

    if (!isAccountMultisig) {
        return <Navigate to={AppRoute.home} />;
    }

    return (
        <DesktopViewPageLayoutStyled ref={scrollRef}>
            <DesktopViewHeader borderBottom={!closeTop} backButton={env === 'mobile'}>
                <Label2>{t('wallet_aside_orders')}</Label2>
            </DesktopViewHeader>
            <DesktopMultisigOrdersPageBody />
        </DesktopViewPageLayoutStyled>
    );
};

const DesktopMultisigOrdersPageBody = () => {
    const { data: multisig } = useActiveMultisigWalletInfo();

    if (!multisig) {
        return <SkeletonListDesktopAdaptive size={3} />;
    }

    if (!multisig.orders.length) {
        return <EmptyOrdersPage />;
    }

    return <ManageExistingMultisigOrders multisig={multisig} />;
};

export const ManageExistingMultisigOrders: FC<{ multisig: Multisig }> = ({ multisig }) => {
    const { t } = useTranslation();
    const { mutate: markAsViewed } = useMarkAccountOrdersAsViewed();

    useEffect(() => {
        markAsViewed({ orders: multisig.orders.map(o => o.address) });
    }, [multisig.orders, markAsViewed]);

    const sortedOrders = useMemo(
        () =>
            multisig.orders.sort((a, b) => {
                if (a.creationDate && b.creationDate) {
                    return b.creationDate - a.creationDate;
                }

                const aStatus = orderStatus(a);
                const bStatus = orderStatus(b);

                if (aStatus === 'expired') {
                    if (bStatus === 'expired') {
                        return b.expirationDate - a.expirationDate;
                    } else {
                        return 1;
                    }
                }

                if (bStatus === 'expired') {
                    return -1;
                }

                return b.expirationDate - a.expirationDate;
            }),
        [multisig.orders]
    );

    return (
        <OrdersGrid>
            <RowDivider />
            <TH>{t('multisig_orders_th_created')}</TH>
            <TH>{t('multisig_orders_th_status')}</TH>
            <TH>{t('multisig_orders_th_signatures')}</TH>
            <AmountTH>{t('multisig_orders_th_send')}</AmountTH>
            <TH />
            <RowDivider />
            {sortedOrders.map(order => (
                <OrderRow key={order.orderSeqno} order={order} />
            ))}
        </OrdersGrid>
    );
};

const OrdersGrid = styled.div`
    display: grid;
    grid-template-columns: minmax(128px, auto) minmax(96px, auto) minmax(70px, auto) 1fr auto;
    column-gap: 0.5rem;
    padding: 0 1rem;
`;

const RowDivider = styled.div`
    background-color: ${p => p.theme.separatorCommon};
    height: 1px;
    grid-column: 1/-1;
    margin: 0 -1rem;
`;

const OrderRow: FC<{ order: MultisigOrder }> = ({ order }) => {
    const { t } = useTranslation();
    const { status, secondsLeft } = useOrderInfo(order);
    const { onOpen: onView } = useMultisigOrderNotification();

    const sdk = useAppSdk();
    const config = useActiveConfig();

    const onOpenTonviewer = (address: string) => {
        const explorerUrl = config.accountExplorer ?? 'https://tonviewer.com/%s';

        sdk.openPage(explorerUrl.replace('%s', formatAddress(address)));
    };

    return (
        <>
            <CreationDateCellContent>
                {order.creationDate ? <CreationDateCell creationDate={order.creationDate} /> : '—'}
            </CreationDateCellContent>
            {status === 'progress' ? (
                <TimeCell>{toTimeLeft(secondsLeft * 1000)}</TimeCell>
            ) : (
                <StatusCell>{t('multisig_status_' + status)}</StatusCell>
            )}
            <Cell>
                {t('multisig_signed_value_short', {
                    signed: order.approvalsNum,
                    total: order.threshold
                })}
            </Cell>
            <AmountCell risk={order.risk} />
            <ButtonCell>
                <Button
                    primary={status === 'progress'}
                    secondary={status !== 'progress'}
                    onClick={() => {
                        if (status === 'expired') {
                            onOpenTonviewer(order.address);
                        } else {
                            onView({ orderAddress: order.address });
                        }
                    }}
                >
                    {t('multisig_order_view')}
                </Button>
            </ButtonCell>
            <RowDivider />
        </>
    );
};

const CreationDateCell: FC<{ creationDate: number }> = ({ creationDate }) => {
    const formattedDate = useDateTimeFormatFromNow(creationDate * 1000);
    return <CreationDateCellContent>{formattedDate}</CreationDateCellContent>;
};

const ArrowUpIconStyled = styled(ArrowUpIcon)`
    color: ${p => p.theme.iconSecondary};
    margin-right: 2px;
    flex-shrink: 0;
`;

const Cell = styled.div`
    display: flex;
    align-items: center;
    padding: 12px 0;

    ${Body2Class};
`;

const TH = styled(Body2)`
    color: ${p => p.theme.textSecondary};
    padding: 8px 0;
`;

const AmountTH = styled(TH)`
    text-align: right;
`;

const CreationDateCellContent = styled(Cell)`
    color: ${p => p.theme.textSecondary};
`;

const ButtonCell = styled(Cell)`
    margin-left: 8px;
`;

const AmountCellContainer = styled(Cell)`
    justify-content: flex-end;
    overflow: hidden;
`;

const AmountValueText = styled.div`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const AmountCell: FC<{ risk: Risk }> = ({ risk }) => {
    const displayTonLimit = toNano(1.05);
    const format = useFormatCoinValue();

    const getTonText = () => {
        return format(risk.ton, TON_ASSET.decimals) + ' TON';
    };

    const getJettonsText = () => {
        return risk.jettons.map(
            (j, index) =>
                format(j.quantity, j.jetton.decimals) +
                ' ' +
                j.jetton.symbol +
                (index === risk.jettons.length - 1 ? '' : '; ')
        );
    };

    if (risk.jettons?.length && risk.ton > displayTonLimit) {
        return (
            <AmountCellContainer>
                <ArrowUpIconStyled />
                <AmountValueText>
                    {getTonText()} {getJettonsText()}
                </AmountValueText>
            </AmountCellContainer>
        );
    }

    if (risk.jettons?.length) {
        return (
            <AmountCellContainer>
                <ArrowUpIconStyled />
                <AmountValueText>{getJettonsText()}</AmountValueText>
            </AmountCellContainer>
        );
    }

    return (
        <AmountCellContainer>
            <ArrowUpIconStyled />
            <AmountValueText>{getTonText()}</AmountValueText>
        </AmountCellContainer>
    );
};

const TimeCell = styled(Cell)`
    font-family: ${p => p.theme.fontMono};
    color: ${p => p.theme.accentGreen};
`;

const StatusCell = styled(Cell)`
    color: ${p => p.theme.textSecondary};
`;

const EmptyMultisigsPageWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: calc(100% - 54px);
    width: 100%;
`;

const EmptyMultisigsPageContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

    > ${Label2} {
        margin-bottom: 4px;
    }

    > ${Body2} {
        color: ${p => p.theme.textSecondary};
        margin-bottom: 24px;
    }
`;

const Buttons = styled.div`
    display: flex;
    gap: 8px;
    margin: 0 auto;
`;

const EmptyOrdersPage = () => {
    const { t } = useTranslation();
    const config = useActiveConfig();
    const sdk = useAppSdk();
    const { onOpen: sendTransfer } = useSendTransferNotification();

    const multisig_about_url = config.multisig_about_url;

    return (
        <EmptyMultisigsPageWrapper>
            <EmptyMultisigsPageContent>
                <Label2>{t('no_multisig_orders_heading')}</Label2>
                <Body2>{t('no_multisig_orders_description')}</Body2>
                <Buttons>
                    <Button primary onClick={() => sendTransfer()}>
                        {t('new_transfer_order_button')}
                    </Button>
                    {multisig_about_url && (
                        <Button onClick={() => sdk.openPage(multisig_about_url)}>
                            {t('no_multisig_learn_more')}
                        </Button>
                    )}
                </Buttons>
            </EmptyMultisigsPageContent>
        </EmptyMultisigsPageWrapper>
    );
};
