import { FC, useId } from 'react';
import { styled } from 'styled-components';

import {
    Notification,
    NotificationBlock,
    NotificationFooter,
    NotificationFooterPortal
} from '../../Notification';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { useTranslation } from '../../../hooks/translation';
import { useProPurchaseController } from '../../../hooks/pro/useProPurchaseController';
import { handleSubmit } from '../../../libs/form';
import { ProSubscriptionLightHeader } from '../../pro/ProSubscriptionLightHeader';
import { ProActiveWallet } from '../../pro/ProActiveWallet';
import { ProChooseSubscriptionPlan } from '../../pro/ProChooseSubscriptionPlan';
import { ProPromoCodeInput } from '../../pro/ProPromoCodeInput';
import { ProFeaturesList } from '../../pro/ProFeaturesList';
import { Button } from '../../fields/Button';
import { Body3, Label2 } from '../../Text';
import { ProLegalNote } from '../../pro/ProLegalNote';
import { useProAuthNotification } from '../../modals/ProAuthNotificationControlled';

interface IProPurchaseNotificationProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProPurchaseNotification: FC<IProPurchaseNotificationProps> = props => {
    const { isOpen, onClose } = props;

    return (
        <NotificationStyled mobileFullScreen isOpen={isOpen} handleClose={onClose}>
            {() => <ProPurchaseNotificationContent onClose={onClose} />}
        </NotificationStyled>
    );
};

type ContentProps = Pick<IProPurchaseNotificationProps, 'onClose'>;

export const ProPurchaseNotificationContent: FC<ContentProps> = ({ onClose: onCurrentClose }) => {
    const formId = useId();
    const { t } = useTranslation();
    const { states, methods } = useProPurchaseController();
    const { onOpen: onProAuthOpen } = useProAuthNotification();
    const { isOpen: isPromoShown, onOpen: showPromo } = useDisclosure(false);

    const { isCrypto, isLoading, isLoggingOut, promoCode, productsForRender, verifiedPromoCode } =
        states;

    const { onSubmit, onLogout, setPromoCode, selectedPlanId, setSelectedPlanId, onManage } =
        methods;

    const handleDisconnect = async () => {
        await onLogout();
        onCurrentClose();
        onProAuthOpen();
    };

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

            <ProChooseSubscriptionPlan
                isEnterPromoVisible={isCrypto && !isPromoShown}
                onPromoInputShow={showPromo}
                isLoading={isLoading}
                selectedPlanId={selectedPlanId}
                onPlanIdSelection={setSelectedPlanId}
                productsForRender={productsForRender}
                promoCodeNode={
                    isCrypto &&
                    isPromoShown && (
                        <ProPromoCodeInput
                            value={promoCode}
                            onChange={setPromoCode}
                            promoCode={verifiedPromoCode}
                        />
                    )
                }
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
                            loading={isLoading}
                        >
                            <Label2>{t('continue_with_tonkeeper_pro')}</Label2>
                        </Button>
                        <ProLegalNote onManage={onManage} />
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
