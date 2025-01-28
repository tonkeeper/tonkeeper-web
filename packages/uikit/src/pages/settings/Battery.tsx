import { FC, useState } from 'react';
import { InnerBody } from '../../components/Body';
import { SubHeader } from '../../components/SubHeader';
import { Body2, Label2 } from '../../components/Text';
import { useActiveAccount, useActiveConfig } from '../../state/wallet';
import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import styled from 'styled-components';
import { BatteryInfoHeading } from '../../components/settings/battery/BatteryInfoHeading';
import {
    useBatteryBalance,
    useBatteryEnabledConfig,
    useProvideBatteryAuth
} from '../../state/battery';
import { GearIconEmpty, SpinnerRing } from '../../components/Icon';
import { BuyBatteryMethods } from '../../components/settings/battery/BuyBatteryMethods';
import { BatterySettingsNotification } from '../../components/settings/battery/BatterySettingsNotification';
import { useDisclosure } from '../../hooks/useDisclosure';
import { useTranslation } from '../../hooks/translation';
import { ErrorBoundary } from 'react-error-boundary';
import { fallbackRenderOver } from '../../components/Error';
import { IconButton, IconButtonTransparentBackground } from '../../components/fields/IconButton';
import { useAppSdk, useAppTargetEnv } from '../../hooks/appSdk';
import { BatteryRechargeNotification } from '../../components/settings/battery/BatteryRechargeNotification';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { AppRoute } from '../../libs/routes';
import { HideOnReview } from '../../components/ios/HideOnReview';
import { Navigate } from '../../components/shared/Navigate';

export const BatteryPage = () => {
    const account = useActiveAccount();
    const { disableWhole } = useBatteryEnabledConfig();

    if ((account.type !== 'mnemonic' && account.type !== 'mam') || disableWhole) {
        return <Navigate to={AppRoute.home} />;
    }

    return (
        <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display Battery page')}>
            <HideOnReview>
                <BatteryPageLayout />
            </HideOnReview>
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

const SettingsButtonMobile = styled(IconButton)`
    position: absolute;
    right: 16px;
    width: 32px;
    height: 32px;
`;

export const BatteryPageLayout: FC = () => {
    useProvideBatteryAuth();
    const { data } = useBatteryBalance();
    const isFullWidth = useIsFullWidthMode();
    const { t } = useTranslation();
    const { isOpen, onClose, onOpen } = useDisclosure();
    const env = useAppTargetEnv();

    if (isFullWidth) {
        return (
            <DesktopViewPageLayout>
                <DesktopViewHeaderStyled borderBottom backButton={env === 'mobile'}>
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
            <SubHeader title={t('battery_title')}>
                {data?.batteryUnitsBalance.gt(0) && (
                    <SettingsButtonMobile onClick={onOpen}>
                        <GearIconEmpty />
                    </SettingsButtonMobile>
                )}
            </SubHeader>
            <InnerBody>
                <BatteryPageContent />
            </InnerBody>
            <BatterySettingsNotification isOpen={isOpen} onClose={onClose} />
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
    const { batteryRefundEndpoint } = useActiveConfig();
    const [preselectedRechargeAsset, setPreselectedRechargeAsset] = useState<string | undefined>();
    const [asGift, setAsGift] = useState(false);

    const onMethodSelected = (value: { type: 'asset'; assetId: string } | { type: 'gift' }) => {
        if (value.type === 'asset') {
            setAsGift(false);
            setPreselectedRechargeAsset(value.assetId);
        } else {
            setAsGift(true);
            setPreselectedRechargeAsset(TON_ASSET.id);
        }
    };

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
            <BuyBatteryMethods onMethodSelected={onMethodSelected} />
            <RefundsBlock>
                <Body2>{t('battery_packages_disclaimer')}</Body2>{' '}
                {!!batteryRefundEndpoint && (
                    <RefundsLink onClick={() => sdk.openPage(batteryRefundEndpoint)}>
                        {t('battery_refunds_link')}
                    </RefundsLink>
                )}
            </RefundsBlock>
            <BatteryRechargeNotification
                isOpen={preselectedRechargeAsset !== undefined}
                preselectAssetId={preselectedRechargeAsset}
                onClose={() => {
                    setPreselectedRechargeAsset(undefined);
                    setTimeout(() => setAsGift(false), 300);
                }}
                asGift={asGift}
            />
        </ContentWrapper>
    );
};
