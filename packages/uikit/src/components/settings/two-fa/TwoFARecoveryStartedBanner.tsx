import styled from 'styled-components';
import { BorderSmallResponsive } from '../../shared/Styles';
import { hexToRGBA } from '../../../libs/css';
import { AppRoute, WalletSettingsRoute } from '../../../libs/routes';
import { ExclamationMarkTriangleIcon } from '../../Icon';
import { Label2 } from '../../Text';
import { useTwoFAWalletConfig } from '../../../state/two-fa';
import { useTranslation } from '../../../hooks/translation';
import { Link } from '../../shared/Link';
import { FC, PropsWithChildren } from 'react';

const TwoFARecoveryStartedContainer = styled(Link)`
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

export const TwoFARecoveryStartedBanner: FC<PropsWithChildren<{ className?: string }>> = ({
    className,
    children
}) => {
    const { data: twoFAConfig } = useTwoFAWalletConfig();
    const { t } = useTranslation();

    if (twoFAConfig?.status !== 'disabling') {
        return null;
    }
    return (
        <>
            {children}
            <TwoFARecoveryStartedContainer
                to={AppRoute.walletSettings + WalletSettingsRoute.twoFa}
                replace={false}
                className={className}
            >
                <ExclamationMarkTriangleIcon />
                <Label2>{t('wallet_2fa_recovery_started')}</Label2>
            </TwoFARecoveryStartedContainer>
        </>
    );
};
