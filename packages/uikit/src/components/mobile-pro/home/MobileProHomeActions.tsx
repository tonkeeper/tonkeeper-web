import styled, { css } from 'styled-components';
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
import { useActiveTonNetwork, useIsActiveWalletWatchOnly } from '../../../state/wallet';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { HideOnReview } from '../../ios/HideOnReview';

const Grid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1px 1fr 1px 1fr;
    grid-template-rows: 84px 1px 84px;
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
        color: ${p => p.theme.iconPrimary};
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
                  padding-top: 28px;
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

    const isReadOnly = useIsActiveWalletWatchOnly();
    const isTestnet = useActiveTonNetwork() === Network.TESTNET;

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
                    $disabled={isReadOnly || isTestnet}
                >
                    <SwapIcon />
                    <Label2>{t('wallet_swap')}</Label2>
                </ActionCell>
                <VerticalDivider $bottom>
                    <VerticalDividerCentralPart />
                    <VerticalDividerBottomPart />
                </VerticalDivider>
                <ActionCell onClick={() => navigate(AppProRoute.multiSend)} $disabled>
                    <MultisendIcon />
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

const ArrowUpIcon = () => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
        >
            <mask id="path-1-inside-1_55532_136013" fill="white">
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M13.2929 5.29485C13.6834 4.90432 14.3166 4.90432 14.7071 5.29485L20.7071 11.2948C21.0976 11.6854 21.0976 12.3185 20.7071 12.7091C20.3166 13.0996 19.6834 13.0996 19.2929 12.7091L15 8.41617V22.002C15 22.5542 14.5523 23.002 14 23.002C13.4477 23.002 13 22.5542 13 22.002V8.41617L8.70711 12.7091C8.31658 13.0996 7.68342 13.0996 7.29289 12.7091C6.90237 12.3185 6.90237 11.6854 7.29289 11.2948L13.2929 5.29485Z"
                />
            </mask>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13.2929 5.29485C13.6834 4.90432 14.3166 4.90432 14.7071 5.29485L20.7071 11.2948C21.0976 11.6854 21.0976 12.3185 20.7071 12.7091C20.3166 13.0996 19.6834 13.0996 19.2929 12.7091L15 8.41617V22.002C15 22.5542 14.5523 23.002 14 23.002C13.4477 23.002 13 22.5542 13 22.002V8.41617L8.70711 12.7091C8.31658 13.0996 7.68342 13.0996 7.29289 12.7091C6.90237 12.3185 6.90237 11.6854 7.29289 11.2948L13.2929 5.29485Z"
                fill="currentColor"
            />
            <path
                d="M14.7071 5.29485L14 6.00195L14 6.00195L14.7071 5.29485ZM13.2929 5.29485L14 6.00195L14 6.00195L13.2929 5.29485ZM20.7071 11.2948L20 12.002L20 12.002L20.7071 11.2948ZM20.7071 12.7091L20 12.002L20 12.002L20.7071 12.7091ZM19.2929 12.7091L20 12.002L20 12.002L19.2929 12.7091ZM15 8.41617L15.7071 7.70906L14 6.00195V8.41617H15ZM13 8.41617H14V6.00195L12.2929 7.70906L13 8.41617ZM8.70711 12.7091L8 12.002H8L8.70711 12.7091ZM7.29289 12.7091L8 12.002L8 12.002L7.29289 12.7091ZM7.29289 11.2948L8 12.002L8 12.002L7.29289 11.2948ZM15.4142 4.58774C14.6332 3.80669 13.3668 3.80669 12.5858 4.58774L14 6.00195H14L15.4142 4.58774ZM21.4142 10.5877L15.4142 4.58774L14 6.00195L20 12.002L21.4142 10.5877ZM21.4142 13.4162C22.1953 12.6351 22.1953 11.3688 21.4142 10.5877L20 12.002V12.002L21.4142 13.4162ZM18.5858 13.4162C19.3668 14.1972 20.6332 14.1972 21.4142 13.4162L20 12.002H20L18.5858 13.4162ZM14.2929 9.12327L18.5858 13.4162L20 12.002L15.7071 7.70906L14.2929 9.12327ZM16 22.002V8.41617H14V22.002H16ZM14 24.002C15.1046 24.002 16 23.1065 16 22.002H14V24.002ZM12 22.002C12 23.1065 12.8954 24.002 14 24.002V22.002H12ZM12 8.41617V22.002H14V8.41617H12ZM9.41421 13.4162L13.7071 9.12327L12.2929 7.70906L8 12.002L9.41421 13.4162ZM6.58579 13.4162C7.36683 14.1972 8.63317 14.1972 9.41421 13.4162L8 12.002H8L6.58579 13.4162ZM6.58579 10.5877C5.80474 11.3688 5.80474 12.6351 6.58579 13.4162L8 12.002V12.002L6.58579 10.5877ZM12.5858 4.58774L6.58579 10.5877L8 12.002L14 6.00195L12.5858 4.58774Z"
                fill="currentColor"
                mask="url(#path-1-inside-1_55532_136013)"
            />
        </svg>
    );
};

const ArrowDownIcon = () => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
        >
            <mask id="path-1-inside-1_55532_136019" fill="white">
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M13.2929 22.7091C13.6834 23.0996 14.3166 23.0996 14.7071 22.7091L20.7071 16.7091C21.0976 16.3185 21.0976 15.6854 20.7071 15.2948C20.3166 14.9043 19.6834 14.9043 19.2929 15.2948L15 19.5877V6.00195C15 5.44967 14.5523 5.00195 14 5.00195C13.4477 5.00195 13 5.44967 13 6.00195V19.5877L8.70711 15.2948C8.31658 14.9043 7.68342 14.9043 7.29289 15.2948C6.90237 15.6854 6.90237 16.3185 7.29289 16.7091L13.2929 22.7091Z"
                />
            </mask>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13.2929 22.7091C13.6834 23.0996 14.3166 23.0996 14.7071 22.7091L20.7071 16.7091C21.0976 16.3185 21.0976 15.6854 20.7071 15.2948C20.3166 14.9043 19.6834 14.9043 19.2929 15.2948L15 19.5877V6.00195C15 5.44967 14.5523 5.00195 14 5.00195C13.4477 5.00195 13 5.44967 13 6.00195V19.5877L8.70711 15.2948C8.31658 14.9043 7.68342 14.9043 7.29289 15.2948C6.90237 15.6854 6.90237 16.3185 7.29289 16.7091L13.2929 22.7091Z"
                fill="currentColor"
            />
            <path
                d="M14.7071 22.7091L14 22.002H14L14.7071 22.7091ZM13.2929 22.7091L14 22.002H14L13.2929 22.7091ZM20.7071 16.7091L20 16.002L20 16.002L20.7071 16.7091ZM20.7071 15.2948L20 16.002L20 16.002L20.7071 15.2948ZM19.2929 15.2948L20 16.002H20L19.2929 15.2948ZM15 19.5877H14V22.002L15.7071 20.2948L15 19.5877ZM13 19.5877L12.2929 20.2948L14 22.002V19.5877H13ZM8.70711 15.2948L8 16.002H8L8.70711 15.2948ZM7.29289 15.2948L8 16.002L8 16.002L7.29289 15.2948ZM7.29289 16.7091L8 16.002L8 16.002L7.29289 16.7091ZM14 22.002H14L12.5858 23.4162C13.3668 24.1972 14.6332 24.1972 15.4142 23.4162L14 22.002ZM20 16.002L14 22.002L15.4142 23.4162L21.4142 17.4162L20 16.002ZM20 16.002V16.002L21.4142 17.4162C22.1953 16.6351 22.1953 15.3688 21.4142 14.5877L20 16.002ZM20 16.002H20L21.4142 14.5877C20.6332 13.8067 19.3668 13.8067 18.5858 14.5877L20 16.002ZM15.7071 20.2948L20 16.002L18.5858 14.5877L14.2929 18.8806L15.7071 20.2948ZM14 6.00195V19.5877H16V6.00195H14ZM14 6.00195H16C16 4.89738 15.1046 4.00195 14 4.00195V6.00195ZM14 6.00195V4.00195C12.8954 4.00195 12 4.89738 12 6.00195H14ZM14 19.5877V6.00195H12V19.5877H14ZM8 16.002L12.2929 20.2948L13.7071 18.8806L9.41421 14.5877L8 16.002ZM8 16.002H8L9.41421 14.5877C8.63317 13.8067 7.36683 13.8067 6.58579 14.5877L8 16.002ZM8 16.002V16.002L6.58579 14.5877C5.80474 15.3688 5.80474 16.6351 6.58579 17.4162L8 16.002ZM14 22.002L8 16.002L6.58579 17.4162L12.5858 23.4162L14 22.002Z"
                fill="currentColor"
                mask="url(#path-1-inside-1_55532_136019)"
            />
        </svg>
    );
};

const ScanIcon = () => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10.5 5.00195C10.5 5.55424 10.0523 6.00195 9.5 6.00195L9.4941 6.00194H9.2C8.0799 6.00194 7.51984 6.00194 7.09202 6.21992C6.71569 6.41167 6.40973 6.71763 6.21799 7.09396C6 7.52178 6 8.08183 6 9.20194V9.50191V9.50195C6 10.0542 5.55228 10.502 5 10.502C4.44772 10.502 4 10.0542 4 9.50195C4 9.48291 4.00053 9.46398 4.00158 9.4452C4.0103 7.82363 4.06701 6.9101 4.43597 6.18597C4.81947 5.43333 5.43139 4.8214 6.18404 4.43791C6.90821 4.06892 7.82182 4.01223 9.44359 4.00352C9.46226 4.00248 9.48107 4.00195 9.5 4.00195C10.0523 4.00195 10.5 4.44967 10.5 5.00195ZM10.5 23.002C10.5 23.5542 10.0523 24.002 9.5 24.002C9.48084 24.002 9.4618 24.0014 9.44291 24.0004C7.82156 23.9916 6.90811 23.9349 6.18404 23.566C5.43139 23.1825 4.81947 22.5705 4.43597 21.8179C4.06702 21.0938 4.0103 20.1803 4.00158 18.5587C4.00053 18.5399 4 18.521 4 18.502C4 17.9497 4.44772 17.502 5 17.502C5.55227 17.502 5.99998 17.9496 6 18.5019V18.8019C6 19.922 6 20.4821 6.21799 20.9099C6.40973 21.2862 6.71569 21.5922 7.09202 21.7839C7.51984 22.0019 8.0799 22.0019 9.2 22.0019H9.5L9.5 22.002C10.0523 22.002 10.5 22.4497 10.5 23.002ZM18.5 6.00195L18.5059 6.00194H18.8C19.9201 6.00194 20.4802 6.00194 20.908 6.21992C21.2843 6.41167 21.5903 6.71763 21.782 7.09396C22 7.52178 22 8.08183 22 9.20194V9.50191V9.50195C22 10.0542 22.4477 10.502 23 10.502C23.5523 10.502 24 10.0542 24 9.50195C24 9.48291 23.9995 9.46399 23.9984 9.4452C23.9897 7.82363 23.933 6.9101 23.564 6.18597C23.1805 5.43333 22.5686 4.8214 21.816 4.43791C21.0918 4.06892 20.1782 4.01223 18.5564 4.00352C18.5377 4.00248 18.5189 4.00195 18.5 4.00195C17.9477 4.00195 17.5 4.44967 17.5 5.00195C17.5 5.55424 17.9477 6.00195 18.5 6.00195ZM18.5 24.002C18.5192 24.002 18.5382 24.0014 18.5571 24.0004C20.1784 23.9916 21.0919 23.9349 21.816 23.566C22.5686 23.1825 23.1805 22.5705 23.564 21.8179C23.933 21.0938 23.9897 20.1803 23.9984 18.5587C23.9995 18.5399 24 18.521 24 18.502C24 17.9497 23.5523 17.502 23 17.502C22.4477 17.502 22 17.9496 22 18.5019V18.502V18.8019C22 19.922 22 20.4821 21.782 20.9099C21.5903 21.2862 21.2843 21.5922 20.908 21.7839C20.4802 22.0019 19.9201 22.0019 18.8 22.0019H18.5V22.002C17.9477 22.002 17.5 22.4497 17.5 23.002C17.5 23.5542 17.9477 24.002 18.5 24.002ZM4.0001 10.0019L4 10.4019V17.6019L4.0001 18.0019V10.0019ZM10.16 24.0019H17.84L17.6 24.0019H10.4L10.16 24.0019ZM9 13.002C8.44772 13.002 8 13.4497 8 14.002C8 14.5542 8.44771 15.002 9 15.002H19C19.5523 15.002 20 14.5542 20 14.002C20 13.4497 19.5523 13.002 19 13.002H9Z"
                fill="currentColor"
            />
        </svg>
    );
};

const SwapIcon = () => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.29289 5.29485C7.68342 4.90432 8.31658 4.90432 8.70711 5.29485L13.7071 10.2948C14.0976 10.6854 14.0976 11.3185 13.7071 11.7091C13.3166 12.0996 12.6834 12.0996 12.2929 11.7091L9 8.41617V19.002C9 19.5542 8.55229 20.002 8 20.002C7.44772 20.002 7 19.5542 7 19.002V8.41617L3.70711 11.7091C3.31658 12.0996 2.68342 12.0996 2.29289 11.7091C1.90237 11.3185 1.90237 10.6854 2.29289 10.2948L7.29289 5.29485ZM14.2929 17.7091L19.2929 22.7091C19.6834 23.0996 20.3166 23.0996 20.7071 22.7091L25.7071 17.7091C26.0976 17.3185 26.0976 16.6854 25.7071 16.2948C25.3166 15.9043 24.6834 15.9043 24.2929 16.2948L21 19.5877V9.00201C21 8.44973 20.5523 8.00201 20 8.00201C19.4477 8.00201 19 8.44973 19 9.00201V19.5877L15.7071 16.2948C15.3166 15.9043 14.6834 15.9043 14.2929 16.2948C13.9024 16.6854 13.9024 17.3185 14.2929 17.7091Z"
                fill="currentColor"
            />
        </svg>
    );
};

const MultisendIcon = () => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.20711 5.29485C6.81658 4.90432 6.18342 4.90432 5.79289 5.29485L0.792893 10.2948C0.402369 10.6854 0.402369 11.3185 0.792893 11.7091C1.18342 12.0996 1.81658 12.0996 2.20711 11.7091L5.5 8.41617V22.002C5.5 22.5542 5.94772 23.002 6.5 23.002C7.05228 23.002 7.5 22.5542 7.5 22.002V8.41617L10.7929 11.7091C11.1834 12.0996 11.8166 12.0996 12.2071 11.7091C12.5976 11.3185 12.5976 10.6854 12.2071 10.2948L7.20711 5.29485ZM22.2071 5.29485C21.8166 4.90432 21.1834 4.90432 20.7929 5.29485L15.7929 10.2948C15.4024 10.6854 15.4024 11.3185 15.7929 11.7091C16.1834 12.0996 16.8166 12.0996 17.2071 11.7091L20.5 8.41617V22.002C20.5 22.5542 20.9477 23.002 21.5 23.002C22.0523 23.002 22.5 22.5542 22.5 22.002V8.41617L25.7929 11.7091C26.1834 12.0996 26.8166 12.0996 27.2071 11.7091C27.5976 11.3185 27.5976 10.6854 27.2071 10.2948L22.2071 5.29485Z"
                fill="currentColor"
            />
        </svg>
    );
};

const PlusIcon = () => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
        >
            <path
                d="M14 22.002V14.002M14 14.002V6.00195M14 14.002H22M14 14.002H6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
