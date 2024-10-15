import { FC } from 'react';
import { InnerBody } from '../../components/Body';
import { SubHeader } from '../../components/SubHeader';
import { Body2, Label2 } from '../../components/Text';
import { useActiveAccount } from '../../state/wallet';
import { Navigate } from 'react-router-dom';
import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import styled from 'styled-components';
import { BatteryInfoHeading } from '../../components/settings/battery/BatteryInfoHeading';
import { useBatteryBalance, useProvideBatteryAuth } from '../../state/battery';
import { GearIconEmpty, SpinnerRing } from '../../components/Icon';
import { BuyBatteryMethods } from '../../components/settings/battery/BuyBatteryMethods';
import { BatterySettingsNotification } from '../../components/settings/battery/BatterySettingsNotification';
import { useDisclosure } from '../../hooks/useDisclosure';
import { useTranslation } from '../../hooks/translation';
import { ErrorBoundary } from 'react-error-boundary';
import { fallbackRenderOver } from '../../components/Error';
import { IconButtonTransparentBackground } from '../../components/fields/IconButton';
import { useAppSdk } from '../../hooks/appSdk';
import { useAppContext } from '../../hooks/appContext';
import { BatteryRechargeNotification } from '../../components/settings/battery/BatteryRechargeNotification';

export const BatteryPage = () => {
    const account = useActiveAccount();

    if (account.type !== 'mnemonic' && account.type !== 'mam') {
        return <Navigate to="../" />;
    }

    return (
        <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display Battery page')}>
            <BatteryPageLayout />
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

const HeadingBlock = styled.div`
    padding: 32px 0;
`;

const DesktopViewHeaderStyled = styled(DesktopViewHeader)``;

const SettingsButton = styled(IconButtonTransparentBackground)`
    margin-left: auto;
`;

export const BatteryPageLayout: FC = () => {
    useProvideBatteryAuth();
    const { data } = useBatteryBalance();
    const isFullWidth = useIsFullWidthMode();
    const { t } = useTranslation();
    const { isOpen, onClose, onOpen } = useDisclosure();

    if (isFullWidth) {
        return (
            <DesktopViewPageLayout>
                <DesktopViewHeaderStyled backButton borderBottom>
                    <Label2>{t('battery_title')}</Label2>
                    {data?.batteryUnitsBalance.gt(0) && (
                        <SettingsButton onClick={onOpen}>
                            <GearIconEmpty />
                        </SettingsButton>
                    )}
                </DesktopViewHeaderStyled>
                <BatteryPageContent />
                <BatterySettingsNotification isOpen={isOpen} onClose={onClose} />
            </DesktopViewPageLayout>
        );
    }

    return (
        <>
            <SubHeader title={t('battery_title')} />
            <InnerBody>
                <BatteryPageContent />
            </InnerBody>
        </>
    );
};

const RefundsBlock = styled.div`
    padding: 24px 0;
    color: ${p => p.theme.textSecondary};
`;

const RefundsLink = styled(Body2)`
    color: ${p => p.theme.accentBlueConstant};
    cursor: pointer;
`;

export const BatteryPageContent: FC = () => {
    const { data } = useBatteryBalance();
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const {
        config: { batteryRefundEndpoint }
    } = useAppContext();

    if (!data) {
        return (
            <SpinnerWrapper>
                <SpinnerRing />
            </SpinnerWrapper>
        );
    }

    return (
        <ContentWrapper>
            <HeadingBlock>
                <BatteryInfoHeading />
            </HeadingBlock>
            <BuyBatteryMethods />
            <RefundsBlock>
                <Body2>{t('battery_packages_disclaimer')}</Body2>{' '}
                {!!batteryRefundEndpoint && (
                    <RefundsLink onClick={() => sdk.openPage(batteryRefundEndpoint)}>
                        {t('battery_refunds_link')}
                    </RefundsLink>
                )}
            </RefundsBlock>
            <BatteryRechargeNotification isOpen={true} onClose={() => {}} />
        </ContentWrapper>
    );
};
