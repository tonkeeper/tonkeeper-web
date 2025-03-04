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
import { hexToRGBA } from '../../../libs/css';
import {
    useActiveAccount,
    useActiveTonNetwork,
    useIsActiveWalletWatchOnly
} from '../../../state/wallet';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { HideOnReview } from '../../ios/HideOnReview';

const Grid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1px 1fr 1px 1fr;
    grid-template-rows: 72px 1px 72px;
`;

const ActionCell = styled.div<{ $disabled?: boolean }>`
    padding: 16px 8px;
    gap: 4px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    ${p =>
        p.$disabled &&
        css`
            opacity: 0.35;
            pointer-events: none;
        `}

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

const Gradient = styled.div<{ $angel: string }>`
    ${p => css`
        background: linear-gradient(
            ${p.$angel},
            ${p.theme.backgroundContent} 0%,
            ${hexToRGBA(p.theme.backgroundContent, 0.99)} 6.67%,
            ${hexToRGBA(p.theme.backgroundContent, 0.96)} 13.33%,
            ${hexToRGBA(p.theme.backgroundContent, 0.92)} 20%,
            ${hexToRGBA(p.theme.backgroundContent, 0.85)} 26.67%,
            ${hexToRGBA(p.theme.backgroundContent, 0.77)} 33.33%,
            ${hexToRGBA(p.theme.backgroundContent, 0.67)} 40%,
            ${hexToRGBA(p.theme.backgroundContent, 0.56)} 46.67%,
            ${hexToRGBA(p.theme.backgroundContent, 0.44)} 53.33%,
            ${hexToRGBA(p.theme.backgroundContent, 0.33)} 60%,
            ${hexToRGBA(p.theme.backgroundContent, 0.23)} 66.67%,
            ${hexToRGBA(p.theme.backgroundContent, 0.15)} 73.33%,
            ${hexToRGBA(p.theme.backgroundContent, 0.08)} 80%,
            ${hexToRGBA(p.theme.backgroundContent, 0.04)} 86.67%,
            ${hexToRGBA(p.theme.backgroundContent, 0.01)} 93.33%,
            ${hexToRGBA(p.theme.backgroundContent, 0)} 100%
        );
    `};
`;

const Gradient0: FC<{ className?: string }> = p => <Gradient $angel="0deg" {...p} />;

const VerticalDividerTopPart = styled(Gradient0)`
    height: 24px;
`;

const VerticalDividerCentralPart = styled.div`
    height: 32px;
    background: ${p => p.theme.backgroundContent};
`;

const VerticalDividerBottomPart = styled(VerticalDividerTopPart)`
    transform: rotate(180deg);
`;

const HorizontalDivider = styled.div`
    padding: 0 8px;
    height: 1px;
    display: flex;
    grid-column: 1 / -1;
`;

const Gradient270: FC<{ className?: string }> = p => <Gradient $angel="270deg" {...p} />;
const HorizontalDividerLeftPart = styled(Gradient270)`
    width: 48px;
`;

const HorizontalDividerCentralPart = styled.div`
    background: ${p => p.theme.backgroundContent};
    flex: 1;
`;

const Gradient90: FC<{ className?: string }> = p => <Gradient $angel="90deg" {...p} />;
const HorizontalDividerRightPart = styled(Gradient90)`
    width: 48px;
`;

export const MobileProHomeActions: FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    const { onOpen: sendTransfer } = useSendTransferNotification();
    const navigate = useNavigate();
    const sdk = useAppSdk();
    const { onOpen: onBuy } = useBuyNotification();
    const { onScan, NotificationComponent } = useSmartScanner();
    const activeAccount = useActiveAccount();

    const isReadOnly = useIsActiveWalletWatchOnly();
    const isTestnet = useActiveTonNetwork() === Network.TESTNET;
    const isStandardTon = isAccountTonWalletStandard(activeAccount);

    return (
        <Grid className={className}>
            <ActionCell $disabled={isReadOnly} onClick={() => sendTransfer()}>
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
            <ActionCell onClick={onScan} $disabled={isReadOnly}>
                <ScanIcon />
                <Label2>{t('wallet_scan_btn')}</Label2>
            </ActionCell>
            <HideOnReview>
                <HorizontalDivider>
                    <HorizontalDividerLeftPart />
                    <HorizontalDividerCentralPart />
                    <HorizontalDividerRightPart />
                </HorizontalDivider>
                <ActionCell
                    onClick={() => navigate(AppRoute.swap)}
                    $disabled={isReadOnly || !isStandardTon || isTestnet}
                >
                    <SwapIcon />
                    <Label2>{t('wallet_swap')}</Label2>
                </ActionCell>
                <VerticalDivider $bottom>
                    <VerticalDividerCentralPart />
                    <VerticalDividerBottomPart />
                </VerticalDivider>
                <ActionCell
                    onClick={() => navigate(AppProRoute.multiSend)}
                    $disabled={isReadOnly || !isStandardTon}
                >
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
            </HideOnReview>
            {NotificationComponent}
        </Grid>
    );
};
