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
import { Body3, Label2 } from '../../Text';
import { ProLegalNote } from '../../pro/ProLegalNote';
import { useProAuthNotification } from '../../modals/ProAuthNotificationControlled';
import { ErrorBoundary } from '../../shared/ErrorBoundary';
import { fallbackRenderOver } from '../../Error';
import { ProChoosePaymentMethod } from '../../pro/ProChoosePaymentMethod';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';
import { useProductSelection } from '../../../hooks/pro/useProductSelection';

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
    const { onOpen: onProAuthOpen } = useProAuthNotification();

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

    const handleDisconnect = async () => {
        await onLogout();
        onCurrentClose();
        onProAuthOpen();
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
        <ContentWrapper onSubmit={handleSubmit(onSubmit)} id={formId}>
            <ProSubscriptionLightHeader
                titleKey="get_tonkeeper_pro"
                subtitleKey="choose_billing_description"
            />

            <ProActiveWallet
                title={<Body3Styled>{t('selected_wallet')}</Body3Styled>}
                isLoading={isLoggingOut}
                onDisconnect={handleDisconnect}
            />

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

            <NotificationFooterPortal>
                <NotificationFooter>
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
                </NotificationFooter>
            </NotificationFooterPortal>
        </ContentWrapper>
    );
};

const ContentWrapper = styled(NotificationBlock)`
    padding: 1rem 0 2rem;
`;

const PurchaseButtonWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 0;
    width: 100%;
`;

const Body3Styled = styled(Body3)`
    color: ${props => props.theme.textSecondary};
`;

const NotificationStyled = styled(Notification)`
    max-width: 650px;
`;
