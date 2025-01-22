import { ErrorBoundary } from 'react-error-boundary';
import styled from 'styled-components';
import { useAppSdk } from '../../../hooks/appSdk';
import { useTranslation } from '../../../hooks/translation';
import { usePreFetchRates } from '../../../state/rates';
import {
    useActiveTonNetwork,
    useActiveWallet,
    useIsActiveWalletWatchOnly
} from '../../../state/wallet';
import { fallbackRenderOver } from '../../Error';
import { ArrowDownIcon, ArrowUpIcon, ExclamationMarkTriangleIcon, PlusIconSmall } from '../../Icon';
import { Button } from '../../fields/Button';
import { Link } from 'react-router-dom';
import { AppProRoute, AppRoute, WalletSettingsRoute } from '../../../libs/routes';
import { useWalletTotalBalance } from '../../../state/asset';
import { DesktopHeaderBalance, DesktopHeaderContainer } from './DesktopHeaderElements';
import { useSendTransferNotification } from '../../modals/useSendTransferNotification';
import { isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { HideOnReview } from '../../ios/HideOnReview';
import { BorderSmallResponsive } from '../../shared/Styles';
import { hexToRGBA } from '../../../libs/css';
import { Label2 } from '../../Text';
import { useTwoFAWalletConfig } from '../../../state/two-fa';
import { useBuyNotification } from '../../modals/BuyNotificationControlled';

const ButtonsContainer = styled.div`
    display: flex;
    gap: 0.5rem;
    padding: 1rem;

    > * {
        text-decoration: none;
    }
`;

const DesktopRightPart = styled.div`
    display: flex;
`;

const DesktopLeftPart = styled.div`
    display: flex;
    gap: 16px;
    align-items: center;
`;

const ButtonStyled = styled(Button)`
    display: flex;
    gap: 6px;

    > svg {
        color: ${p => p.theme.buttonTertiaryForeground};
    }
`;

const LinkStyled = styled(Link)`
    text-decoration: unset;
`;

const TwoFARecoveryStarted = styled(Link)`
    text-decoration: unset;
    box-sizing: border-box;
    min-height: 36px;
    ${BorderSmallResponsive};
    background-color: ${p => hexToRGBA(p.theme.accentOrange, 0.16)};
    color: ${p => p.theme.accentOrange};
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    transition: background-color 0.1s ease-in;

    &:hover {
        background-color: ${p => hexToRGBA(p.theme.accentOrange, 0.2)};
    }
`;

const DesktopWalletHeaderPayload = () => {
    usePreFetchRates();
    const { data: balance, isLoading } = useWalletTotalBalance();
    const sdk = useAppSdk();
    const { onOpen: onBuy } = useBuyNotification();
    const { t } = useTranslation();
    const isReadOnly = useIsActiveWalletWatchOnly();
    const activeWallet = useActiveWallet();
    const { onOpen: sendTransfer } = useSendTransferNotification();
    const network = useActiveTonNetwork();
    const { data: twoFAConfig } = useTwoFAWalletConfig();

    return (
        <DesktopHeaderContainer>
            <DesktopLeftPart>
                <DesktopHeaderBalance isLoading={isLoading} balance={balance} network={network} />
                {twoFAConfig?.status === 'disabling' && (
                    <TwoFARecoveryStarted to={AppRoute.walletSettings + WalletSettingsRoute.twoFa}>
                        <ExclamationMarkTriangleIcon />
                        <Label2>{t('wallet_2fa_recovery_started')}</Label2>
                    </TwoFARecoveryStarted>
                )}
            </DesktopLeftPart>
            <DesktopRightPart>
                <ButtonsContainer>
                    {!isReadOnly && (
                        <ButtonStyled size="small" onClick={() => sendTransfer()}>
                            <ArrowUpIcon />
                            {t('wallet_send')}
                        </ButtonStyled>
                    )}
                    <HideOnReview>
                        {!isReadOnly && isStandardTonWallet(activeWallet) && (
                            <LinkStyled to={AppProRoute.multiSend}>
                                <ButtonStyled size="small">
                                    <ArrowUpIcon />
                                    {t('wallet_multi_send')}
                                </ButtonStyled>
                            </LinkStyled>
                        )}
                    </HideOnReview>
                    <ButtonStyled
                        size="small"
                        onClick={() => {
                            sdk.uiEvents.emit('receive', {
                                method: 'receive',
                                params: {}
                            });
                        }}
                    >
                        <ArrowDownIcon />
                        {t('wallet_receive')}
                    </ButtonStyled>
                    <HideOnReview>
                        {network !== Network.TESTNET && (
                            <ButtonStyled size="small" onClick={onBuy}>
                                <PlusIconSmall />
                                {t('wallet_buy')}
                            </ButtonStyled>
                        )}
                    </HideOnReview>
                </ButtonsContainer>
            </DesktopRightPart>
        </DesktopHeaderContainer>
    );
};

export const DesktopWalletHeader = () => {
    return (
        <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display desktop header')}>
            <DesktopWalletHeaderPayload />
        </ErrorBoundary>
    );
};
