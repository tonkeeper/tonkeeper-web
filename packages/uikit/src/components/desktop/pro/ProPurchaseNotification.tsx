import { FC, useId } from 'react';
import { styled } from 'styled-components';

import {
    Notification,
    NotificationBlock,
    NotificationFooter,
    NotificationFooterPortal
} from '../../Notification';
import { useTranslation } from '../../../hooks/translation';
import { useProPurchaseController } from '../../../hooks/pro/useProPurchaseController';
import { handleSubmit } from '../../../libs/form';
import { ProSubscriptionLightHeader } from '../../pro/ProSubscriptionLightHeader';
import { ProActiveWallet } from '../../pro/ProActiveWallet';
import { ProChooseSubscriptionPlan } from '../../pro/ProChooseSubscriptionPlan';
import { ProFeaturesList } from '../../pro/ProFeaturesList';
import { Button } from '../../fields/Button';
import { Body2, Body3, Label2 } from '../../Text';
import { ProLegalNote } from '../../pro/ProLegalNote';
import { useProAuthNotification } from '../../modals/ProAuthNotificationControlled';
import { ErrorBoundary } from '../../shared/ErrorBoundary';
import { fallbackRenderOver } from '../../Error';
import { ProChoosePaymentMethod } from '../../pro/ProChoosePaymentMethod';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';
import { useProductSelection } from '../../../hooks/pro/useProductSelection';
import { QRCode } from 'react-qrcode-logo';
import { useProFeaturesNotification } from '../../modals/ProFeaturesNotificationControlled';
import { useActiveConfig } from '../../../state/wallet';
import { useAppSdk } from '../../../hooks/appSdk';

interface IProPurchaseNotificationProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProPurchaseNotification: FC<IProPurchaseNotificationProps> = props => {
    const { isOpen, onClose } = props;

    return (
        <NotificationStyled mobileFullScreen isOpen={isOpen} handleClose={onClose}>
            {() => (
                <ErrorBoundary
                    fallbackRender={fallbackRenderOver('Failed to display Pro Purchase modal')}
                >
                    <ProPurchaseNotificationContent onClose={onClose} />
                </ErrorBoundary>
            )}
        </NotificationStyled>
    );
};

type ContentProps = Pick<IProPurchaseNotificationProps, 'onClose'>;

export const ProPurchaseNotificationContent: FC<ContentProps> = ({ onClose: onCurrentClose }) => {
    const sdk = useAppSdk();
    const formId = useId();
    const { t } = useTranslation();
    const { flags, pro_mobile_app_appstore_link } = useActiveConfig();
    const { onOpen: onProAuthOpen } = useProAuthNotification();
    const { onOpen: onProFeaturesOpen } = useProFeaturesNotification();

    const { states, methods } = useProPurchaseController();
    const { onLogout, onManage, onPurchase } = methods;
    const { isPurchasing, isManageLoading, isLoggingOut } = states;

    const {
        plans,
        selectedSource,
        selectedPlanId,
        onPlanIdSelect,
        onSourceSelect,
        availableSources,
        productsForRender,
        isSelectionLoading
    } = useProductSelection();

    const isGlobalLoading = isPurchasing || isLoggingOut || isManageLoading || isSelectionLoading;

    const isCryptoDisabled = flags.disable_crypto_subscription && !sdk.isIOs();

    const handleDisconnect = async () => {
        await onLogout();
        onCurrentClose();
        onProAuthOpen();
    };

    const handleOpenFeatures = async () => {
        onCurrentClose();
        onProFeaturesOpen();
    };

    const handleSourceSelection = (source: SubscriptionSource) => {
        if (isGlobalLoading) return;

        onSourceSelect(source);
    };

    const onSubmit = () =>
        onPurchase({
            plans,
            selectedPlanId,
            selectedSource
        });

    return (
        <ContentWrapper onSubmit={handleSubmit(onSubmit)} id={formId} spaced={!isCryptoDisabled}>
            <ProSubscriptionLightHeader
                titleKey={isCryptoDisabled ? 'tonkeeper_pro_subscription' : 'get_tonkeeper_pro'}
                subtitleKey={
                    isCryptoDisabled
                        ? 'unavailable_on_desktop_in_region'
                        : 'choose_billing_description'
                }
            />

            <ProActiveWallet
                title={<Body3Styled>{t('selected_wallet')}</Body3Styled>}
                belowCaption={
                    isCryptoDisabled ? (
                        <Body3Styled>{t('no_active_pro_on_wallet')}</Body3Styled>
                    ) : undefined
                }
                isLoading={isLoggingOut}
                onDisconnect={handleDisconnect}
            />

            {isCryptoDisabled && <QrCodeSection qrValue={pro_mobile_app_appstore_link} />}

            {!isCryptoDisabled && (
                <>
                    {availableSources.length > 1 && (
                        <ProChoosePaymentMethod
                            isLoading={isGlobalLoading}
                            sources={availableSources}
                            selectedSource={selectedSource}
                            onSourceSelect={handleSourceSelection}
                        />
                    )}

                    <ProChooseSubscriptionPlan
                        isLoading={isGlobalLoading}
                        selectedPlanId={selectedPlanId}
                        onPlanIdSelection={onPlanIdSelect}
                        productsForRender={productsForRender}
                    />

                    <ProFeaturesList />
                </>
            )}

            <NotificationFooterPortal>
                <NotificationFooter>
                    {isCryptoDisabled ? (
                        <Button secondary fullWidth type="button" onClick={handleOpenFeatures}>
                            <Label2>{t('tonkeeper_pro_features')}</Label2>
                        </Button>
                    ) : (
                        <PurchaseButtonWrapper>
                            <Button
                                primary
                                fullWidth
                                size="large"
                                type="submit"
                                form={formId}
                                loading={isGlobalLoading}
                            >
                                <Label2>{t('continue_with_tonkeeper_pro')}</Label2>
                            </Button>

                            <ProLegalNote selectedSource={selectedSource} onManage={onManage} />
                        </PurchaseButtonWrapper>
                    )}
                </NotificationFooter>
            </NotificationFooterPortal>
        </ContentWrapper>
    );
};

const APPLE_LOGO = `
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.1363 8.50866C11.1444 7.89539 11.3113 7.29408 11.6214 6.76068C11.9315 6.22728 12.3747 5.77913 12.9099 5.45791C12.5699 4.98388 12.1214 4.59377 11.6 4.31857C11.0786 4.04336 10.4986 3.89065 9.90615 3.87255C8.64236 3.74304 7.41719 4.61086 6.77317 4.61086C6.11671 4.61086 5.12517 3.88541 4.05744 3.90686C3.36681 3.92864 2.69373 4.12471 2.10379 4.47597C1.51385 4.82722 1.02716 5.32168 0.691157 5.91117C-0.764321 8.37143 0.321337 11.9872 1.71559 13.9759C2.41317 14.9497 3.22843 16.0375 4.2952 15.9989C5.33909 15.9566 5.72896 15.349 6.98902 15.349C8.23739 15.349 8.60317 15.9989 9.69158 15.9744C10.8117 15.9566 11.5175 14.9962 12.1906 14.0132C12.6918 13.3193 13.0775 12.5525 13.3333 11.741C12.6826 11.4723 12.1272 11.0225 11.7365 10.4477C11.3458 9.87286 11.1371 9.1985 11.1363 8.50866Z" fill="black"/>
        <path d="M9.08395 2.56475C9.6947 1.84895 9.9956 0.928903 9.92274 0C8.98965 0.0956794 8.12774 0.531064 7.50874 1.2194C7.20609 1.55568 6.97429 1.94689 6.8266 2.37067C6.67891 2.79445 6.61821 3.2425 6.64799 3.6892C7.1147 3.69389 7.57642 3.59513 7.99837 3.40036C8.42031 3.20558 8.79149 2.91988 9.08395 2.56475Z" fill="black"/>
    </svg>
`;

const QrCodeSection = ({ qrValue = '' }: { qrValue?: string }) => {
    const { t } = useTranslation();

    return (
        <QrContent>
            <QrWrapper>
                <QRCode
                    value={qrValue}
                    size={128}
                    quietZone={0}
                    bgColor="#fff"
                    qrStyle="squares"
                    logoImage={`data:image/svg+xml;base64,${btoa(APPLE_LOGO)}`}
                    logoWidth={16}
                    logoHeight={16}
                    logoPadding={6}
                    removeQrCodeBehindLogo={true}
                />
            </QrWrapper>
            <Label2>{t('subscribe_on_ios')}</Label2>
            <Body2Styled>{t('purchasing_is_unavailable_on_desktop')}</Body2Styled>
        </QrContent>
    );
};

const QrContent = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;

    width: 100%;
    margin-top: 8px;
    padding: 32px;

    box-sizing: border-box;
    background-color: ${props => props.theme.backgroundContent};
    border-radius: ${p => p.theme.corner2xSmall};
`;

const QrWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;

    width: fit-content;
    padding: 12px;
    margin-bottom: 16px;

    border-radius: ${p => p.theme.corner2xSmall};
    background-color: ${props => props.theme.constantWhite};
`;

const ContentWrapper = styled(NotificationBlock)<{ spaced: boolean }>`
    ${p => (p.spaced ? 'padding: 1rem 0 2rem' : 'padding: 1rem 0 1rem')}
`;

const PurchaseButtonWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 0;
    width: 100%;
`;

const Body2Styled = styled(Body2)`
    margin-top: 4px;

    text-align: center;
    color: ${props => props.theme.textSecondary};
`;

const Body3Styled = styled(Body3)`
    color: ${props => props.theme.textSecondary};
`;

const NotificationStyled = styled(Notification)`
    max-width: 650px;
`;
