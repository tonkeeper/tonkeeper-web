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
    useOrderInfo
} from '../../state/multisig';
import { SkeletonListDesktopAdaptive } from '../../components/Skeleton';
import React, { FC } from 'react';
import { Button } from '../../components/fields/Button';

import { styled } from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { Multisig, type MultisigOrder, Risk } from '@tonkeeper/core/dist/tonApiV2';
import { AppRoute } from '../../libs/routes';
import { Navigate } from 'react-router-dom';
import { useSendTransferNotification } from '../../components/modals/useSendTransferNotification';
import { toTimeLeft } from '@tonkeeper/core/dist/utils/date';
import { ArrowUpIcon } from '../../components/Icon';
import { toNano } from '@ton/core';
import { useFormatCoinValue } from '../../hooks/balance';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';

const DesktopViewPageLayoutStyled = styled(DesktopViewPageLayout)`
    height: 100%;
`;

export const DesktopMultisigOrdersPage = () => {
    const { ref: scrollRef, closeTop } = useIsScrolled();
    const { t } = useTranslation();
    const isAccountMultisig = useIsActiveAccountMultisig();

    if (!isAccountMultisig) {
        return <Navigate to={AppRoute.home} />;
    }

    return (
        <DesktopViewPageLayoutStyled ref={scrollRef}>
            <DesktopViewHeader borderBottom={!closeTop}>
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
    return (
        <OrdersGrid>
            <RowDivider />
            {multisig.orders.map(order => (
                <OrderRow key={order.orderSeqno} order={order} />
            ))}
        </OrdersGrid>
    );
};

const OrdersGrid = styled.div`
    display: grid;
    grid-template-columns: minmax(96px, auto) minmax(134px, auto) minmax(134px, auto) 1fr auto;
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
    const { status, signed, total, secondsLeft } = useOrderInfo(order);
    return (
        <>
            {status === 'progress' ? (
                <TimeCell>{toTimeLeft(secondsLeft * 1000)}</TimeCell>
            ) : (
                <StatusCell>{t('multisig_status_' + status)}</StatusCell>
            )}
            <ActionCell risk={order.risk} />
            <Cell>
                {t('multisig_signed_value')
                    .replace(/%?\{signed}/, signed.toString())
                    .replace(/%?\{total}/, total.toString())}
            </Cell>
            <AmountCell risk={order.risk} />
            <Cell>
                <Button primary={status === 'progress'} secondary={status !== 'progress'}>
                    {t('multisig_order_view')}
                </Button>
            </Cell>
            <RowDivider />
        </>
    );
};

const ArrowUpIconStyled = styled(ArrowUpIcon)`
    color: ${p => p.theme.textPrimary};
`;

const ActionCell: FC<{ risk: Risk }> = ({ risk }) => {
    const { t } = useTranslation();
    const displayTonLimit = toNano(1.05);

    let text;
    switch (true) {
        case risk.jettons?.length && risk.ton > displayTonLimit:
            text = t('order_send_token_and_ton');
            break;
        case !!risk.jettons?.length:
            text = t('order_send_token');
            break;
        default:
            text = t('order_send_ton');
    }

    return (
        <ActionCellContainer>
            <ArrowUpIconStyled />
            <Body2>{text}</Body2>
        </ActionCellContainer>
    );
};

const Cell = styled.div`
    display: flex;
    align-items: center;
    padding: 12px 0;

    ${Body2Class};
`;

const AmountCellContainer = styled(Cell)`
    justify-content: flex-end;
    margin-right: 8px;
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
                <AmountValueText>
                    {getTonText()} {getJettonsText()}
                </AmountValueText>
            </AmountCellContainer>
        );
    }

    if (risk.jettons?.length) {
        return (
            <AmountCellContainer>
                <AmountValueText>{getJettonsText()}</AmountValueText>
            </AmountCellContainer>
        );
    }

    return (
        <AmountCellContainer>
            <AmountValueText>{getTonText()}</AmountValueText>
        </AmountCellContainer>
    );
};

const ActionCellContainer = styled(Cell)`
    display: flex;
    gap: 6px;
    color: ${p => p.theme.textPrimary};
    align-items: center;
`;

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
    const { config } = useAppContext();
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
