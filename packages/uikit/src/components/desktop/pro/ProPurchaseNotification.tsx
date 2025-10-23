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
    const formId = useId();
    const { t } = useTranslation();
    const { pro_mobile_app_appstore_link } = useActiveConfig();
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

    const hasAnySource = availableSources.length > 0;

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
        <ContentWrapper onSubmit={handleSubmit(onSubmit)} id={formId} spaced={hasAnySource}>
            <ProSubscriptionLightHeader
                titleKey={hasAnySource ? 'get_tonkeeper_pro' : 'tonkeeper_pro_subscription'}
                subtitleKey={
                    hasAnySource ? 'choose_billing_description' : 'unavailable_on_desktop_in_region'
                }
            />

            <ProActiveWallet
                title={<Body3Styled>{t('selected_wallet')}</Body3Styled>}
                belowCaption={
                    hasAnySource ? undefined : (
                        <Body3Styled>{t('no_active_pro_on_wallet')}</Body3Styled>
                    )
                }
                isLoading={isLoggingOut}
                onDisconnect={handleDisconnect}
            />

            {!hasAnySource && <QrCodeSection qrValue={pro_mobile_app_appstore_link} />}

            {hasAnySource && (
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
                    {hasAnySource ? (
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
                    ) : (
                        <Button secondary fullWidth type="button" onClick={handleOpenFeatures}>
                            <Label2>{t('tonkeeper_pro_features')}</Label2>
                        </Button>
                    )}
                </NotificationFooter>
            </NotificationFooterPortal>
        </ContentWrapper>
    );
};

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
                    logoImage="https://wallet.tonkeeper.com/img/apple-icon.png"
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
