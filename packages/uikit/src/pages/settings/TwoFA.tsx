import { FC } from 'react';
import { InnerBody } from '../../components/Body';
import { SubHeader } from '../../components/SubHeader';
import { Body2, Body3Class, Label2 } from '../../components/Text';
import { useActiveAccount } from '../../state/wallet';
import { Navigate } from 'react-router-dom';
import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import styled from 'styled-components';
import { ExclamationMarkTriangleIcon, SpinnerRing } from '../../components/Icon';
import { useTranslation } from '../../hooks/translation';
import { ErrorBoundary } from 'react-error-boundary';
import { fallbackRenderOver } from '../../components/Error';
import { AppRoute } from '../../libs/routes';
import { useIsTwoFAEnabledGlobally, useTwoFAWalletConfig } from '../../state/two-fa';
import { hexToRGBA } from '../../libs/css';
import { BorderSmallResponsive } from '../../components/shared/Styles';
import { TwoFASetUp } from '../../components/settings/two-fa/TwoFASetUp';

export const TwoFAPage = () => {
    const account = useActiveAccount();
    const isEnabled = useIsTwoFAEnabledGlobally();

    if ((account.type !== 'mnemonic' && account.type !== 'mam') || !isEnabled) {
        return <Navigate to={AppRoute.home} />;
    }

    return (
        <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display Two FA page')}>
            <TwoFAPageLayout />
        </ErrorBoundary>
    );
};

const ContentWrapper = styled.div`
    max-width: 368px;
    margin: 0 auto;
`;

const SpinnerWrapper = styled.div`
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const TwoFAPageLayout: FC = () => {
    const config = useTwoFAWalletConfig();
    const isFullWidth = useIsFullWidthMode();
    const { t } = useTranslation();

    if (isFullWidth) {
        return (
            <DesktopViewPageLayout>
                <DesktopViewHeader borderBottom backButton>
                    <Label2>{t('two_fa_short')}</Label2>
                </DesktopViewHeader>
                <TwoFAPageContent />
            </DesktopViewPageLayout>
        );
    }

    return (
        <>
            <SubHeader title={t('two_fa_short')} />
            <InnerBody>
                <TwoFAPageContent />
            </InnerBody>
        </>
    );
};

const TextHeadingBlock = styled.div`
    display: flex;
    text-align: center;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    padding: 32px 0;

    > ${Body2} {
        color: ${p => p.theme.textSecondary};
        text-wrap: balance;
    }
`;

const WarningBlock = styled.div`
    background: ${p => hexToRGBA(p.theme.accentOrange, 0.16)};
    color: ${p => p.theme.accentOrange};
    padding: 8px 4px;
    display: flex;
    ${BorderSmallResponsive};
    max-width: 496px;
    margin: 0 auto;
    justify-content: space-between;
`;

const ExclamationMarkTriangleIconStyled = styled(ExclamationMarkTriangleIcon)`
    padding: 4px 8px;
`;

const WarningBlockText = styled.ul`
    ${Body3Class};
    padding-left: 16px;
    margin: 0;
`;

const TwoFASetUpStyled = styled(TwoFASetUp)`
    margin: 0 auto 84px;
`;

export const TwoFAPageContent: FC = () => {
    const { data: config } = useTwoFAWalletConfig();
    const { t } = useTranslation();

    if (!config) {
        return (
            <SpinnerWrapper>
                <SpinnerRing />
            </SpinnerWrapper>
        );
    }

    return (
        <div>
            <ContentWrapper>
                <TextHeadingBlock>
                    <Label2>{t('two_fa_settings_heading_title')}</Label2>
                    <Body2>{t('two_fa_settings_heading_description')}</Body2>
                </TextHeadingBlock>
            </ContentWrapper>
            <TwoFASetUpStyled />
            <WarningBlock>
                <WarningBlockText>
                    <li>{t('two_fa_settings_warning_wallet_will_stop')}</li>
                    <li>{t('two_fa_settings_warning_balance_required')}</li>
                    <li>{t('two_fa_settings_warning_battery_gasless')}</li>
                </WarningBlockText>
                <ExclamationMarkTriangleIconStyled />
            </WarningBlock>
        </div>
    );
};
