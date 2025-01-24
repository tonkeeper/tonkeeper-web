import styled, { css } from 'styled-components';
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, ScanIcon, SwapIcon } from '../../Icon';
import { Label2 } from '../../Text';
import { useTranslation } from '../../../hooks/translation';
import { FC } from 'react';
import { useSendTransferNotification } from '../../modals/useSendTransferNotification';
import { useNavigate } from '../../../hooks/router/useNavigate';
import { useAppSdk } from '../../../hooks/appSdk';
import { useBuyNotification } from '../../modals/BuyNotificationControlled';
import { AppProRoute, AppRoute } from '../../../libs/routes';
import { useSmartScanner } from '../../../hooks/useSmartScanner';

const Grid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1px 1fr 1px 1fr;
    grid-template-rows: 72px 1px 72px;
`;

const ActionCell = styled.div`
    padding: 16px 8px;
    gap: 4px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    svg {
        color: ${p => p.theme.iconSecondary};
    }
`;

const VerticalDivider = styled.div<{ $bottom?: boolean }>`
    width: 1px;
    ${p =>
        p.$bottom
            ? css`
                  padding-bottom: 16px;
              `
            : css`
                  padding-top: 16px;
              `}
`;

const VerticalDividerTopPart = styled.div`
    height: 24px;
    background: linear-gradient(
        0deg,
        #17171a 0%,
        rgba(23, 23, 26, 0.99) 6.67%,
        rgba(23, 23, 26, 0.96) 13.33%,
        rgba(23, 23, 26, 0.92) 20%,
        rgba(23, 23, 26, 0.85) 26.67%,
        rgba(23, 23, 26, 0.77) 33.33%,
        rgba(23, 23, 26, 0.67) 40%,
        rgba(23, 23, 26, 0.56) 46.67%,
        rgba(23, 23, 26, 0.44) 53.33%,
        rgba(23, 23, 26, 0.33) 60%,
        rgba(23, 23, 26, 0.23) 66.67%,
        rgba(23, 23, 26, 0.15) 73.33%,
        rgba(23, 23, 26, 0.08) 80%,
        rgba(23, 23, 26, 0.04) 86.67%,
        rgba(23, 23, 26, 0.01) 93.33%,
        rgba(23, 23, 26, 0) 100%
    );
`;

const VerticalDividerCentralPart = styled.div`
    height: 32px;
    background: ${p => p.theme.backgroundContent};
`;

const VerticalDividerBottomPart = styled.div`
    height: 24px;
    background: linear-gradient(
        0deg,
        #17171a 0%,
        rgba(23, 23, 26, 0.99) 6.67%,
        rgba(23, 23, 26, 0.96) 13.33%,
        rgba(23, 23, 26, 0.92) 20%,
        rgba(23, 23, 26, 0.85) 26.67%,
        rgba(23, 23, 26, 0.77) 33.33%,
        rgba(23, 23, 26, 0.67) 40%,
        rgba(23, 23, 26, 0.56) 46.67%,
        rgba(23, 23, 26, 0.44) 53.33%,
        rgba(23, 23, 26, 0.33) 60%,
        rgba(23, 23, 26, 0.23) 66.67%,
        rgba(23, 23, 26, 0.15) 73.33%,
        rgba(23, 23, 26, 0.08) 80%,
        rgba(23, 23, 26, 0.04) 86.67%,
        rgba(23, 23, 26, 0.01) 93.33%,
        rgba(23, 23, 26, 0) 100%
    );
`;

const HorizontalDivider = styled.div`
    padding: 0 8px;
    height: 1px;
    display: flex;
    grid-column: 1 / -1;
`;

const HorizontalDividerLeftPart = styled.div`
    background: linear-gradient(
        90deg,
        #17171a 0%,
        rgba(23, 23, 26, 0.99) 6.67%,
        rgba(23, 23, 26, 0.96) 13.33%,
        rgba(23, 23, 26, 0.92) 20%,
        rgba(23, 23, 26, 0.85) 26.67%,
        rgba(23, 23, 26, 0.77) 33.33%,
        rgba(23, 23, 26, 0.67) 40%,
        rgba(23, 23, 26, 0.56) 46.67%,
        rgba(23, 23, 26, 0.44) 53.33%,
        rgba(23, 23, 26, 0.33) 60%,
        rgba(23, 23, 26, 0.23) 66.67%,
        rgba(23, 23, 26, 0.15) 73.33%,
        rgba(23, 23, 26, 0.08) 80%,
        rgba(23, 23, 26, 0.04) 86.67%,
        rgba(23, 23, 26, 0.01) 93.33%,
        rgba(23, 23, 26, 0) 100%
    );
    width: 48px;
`;

const HorizontalDividerCentralPart = styled.div`
    background: ${p => p.theme.backgroundContent};
    flex: 1;
`;

const HorizontalDividerRightPart = styled.div`
    background: linear-gradient(
        90deg,
        #17171a 0%,
        rgba(23, 23, 26, 0.99) 6.67%,
        rgba(23, 23, 26, 0.96) 13.33%,
        rgba(23, 23, 26, 0.92) 20%,
        rgba(23, 23, 26, 0.85) 26.67%,
        rgba(23, 23, 26, 0.77) 33.33%,
        rgba(23, 23, 26, 0.67) 40%,
        rgba(23, 23, 26, 0.56) 46.67%,
        rgba(23, 23, 26, 0.44) 53.33%,
        rgba(23, 23, 26, 0.33) 60%,
        rgba(23, 23, 26, 0.23) 66.67%,
        rgba(23, 23, 26, 0.15) 73.33%,
        rgba(23, 23, 26, 0.08) 80%,
        rgba(23, 23, 26, 0.04) 86.67%,
        rgba(23, 23, 26, 0.01) 93.33%,
        rgba(23, 23, 26, 0) 100%
    );
    width: 48px;
`;

export const MobileProHomeActions: FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    const { onOpen: sendTransfer } = useSendTransferNotification();
    const navigate = useNavigate();
    const sdk = useAppSdk();
    const { onOpen: onBuy } = useBuyNotification();
    const { onScan, NotificationComponent } = useSmartScanner();

    return (
        <Grid className={className}>
            <ActionCell onClick={() => sendTransfer()}>
                <ArrowUpIcon />
                <Label2>{t('wallet_send')}</Label2>
            </ActionCell>
            <VerticalDivider>
                <VerticalDividerTopPart />
                <VerticalDividerCentralPart />
            </VerticalDivider>
            <ActionCell
                onClick={() => {
                    sdk.uiEvents.emit('receive', {
                        method: 'receive',
                        params: {}
                    });
                }}
            >
                <ArrowDownIcon />
                <Label2>{t('wallet_receive')}</Label2>
            </ActionCell>
            <VerticalDivider>
                <VerticalDividerTopPart />
                <VerticalDividerCentralPart />
            </VerticalDivider>
            <ActionCell onClick={onScan}>
                <ScanIcon />
                <Label2>{t('wallet_scan_btn')}</Label2>
            </ActionCell>
            <HorizontalDivider>
                <HorizontalDividerLeftPart />
                <HorizontalDividerCentralPart />
                <HorizontalDividerRightPart />
            </HorizontalDivider>
            <ActionCell onClick={() => navigate(AppRoute.swap)}>
                <SwapIcon />
                <Label2>{t('wallet_swap')}</Label2>
            </ActionCell>
            <VerticalDivider $bottom>
                <VerticalDividerCentralPart />
                <VerticalDividerBottomPart />
            </VerticalDivider>
            <ActionCell onClick={() => navigate(AppProRoute.multiSend)}>
                <ArrowUpIcon />
                <Label2>{t('wallet_multi_send')}</Label2>
            </ActionCell>
            <VerticalDivider $bottom>
                <VerticalDividerCentralPart />
                <VerticalDividerBottomPart />
            </VerticalDivider>
            <ActionCell onClick={onBuy}>
                <PlusIcon />
                <Label2>{t('wallet_buy')}</Label2>
            </ActionCell>
            {NotificationComponent}
        </Grid>
    );
};
