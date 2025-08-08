import { type FC } from 'react';
import { styled } from 'styled-components';
import { isTelegramSubscription } from '@tonkeeper/core/dist/entries/pro';

import { Label2 } from '../../Text';
import { Button } from '../../fields/Button';
import { useProState } from '../../../state/pro';
import { HideOnReview } from '../../ios/HideOnReview';
import { useTranslation } from '../../../hooks/translation';
import { ProSubscriptionHeader } from '../../pro/ProSubscriptionHeader';
import { useProAuthNotification } from '../../modals/ProAuthNotificationControlled';
import { useProPurchaseNotification } from '../../modals/ProPurchaseNotificationControlled';
import { Notification, NotificationFooter, NotificationFooterPortal } from '../../Notification';
import { ErrorBoundary } from '../../shared/ErrorBoundary';
import { fallbackRenderOver } from '../../Error';

interface IProEndingNotificationProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProEndingNotification: FC<IProEndingNotificationProps> = ({ isOpen, onClose }) => (
    <HideOnReview>
        <NotificationStyled isOpen={isOpen} handleClose={onClose}>
            {() => (
                <ErrorBoundary
                    fallbackRender={fallbackRenderOver('Failed to display Pro Ending modal')}
                >
                    <ProEndingNotificationContent onClose={onClose} />
                </ErrorBoundary>
            )}
        </NotificationStyled>
    </HideOnReview>
);

export const ProEndingNotificationContent: FC<Pick<IProEndingNotificationProps, 'onClose'>> = ({
    onClose: onCurrentClose
}) => {
    const { t } = useTranslation();
    const { data: subscription } = useProState();
    const { onOpen: onProAuthOpen } = useProAuthNotification();
    const { onOpen: onProPurchaseOpen } = useProPurchaseNotification();

    const handlePurchaseClick = () => {
        onCurrentClose();

        if (isTelegramSubscription(subscription)) {
            onProAuthOpen();
        } else {
            onProPurchaseOpen();
        }
    };

    return (
        <ContentWrapper>
            <ProSubscriptionHeader titleKey="pro_is_ending" subtitleKey="stay_with_tonkeeper_pro" />
            <NotificationFooterPortal>
                <NotificationFooter>
                    <Button primary fullWidth onClick={handlePurchaseClick}>
                        <Label2>{t('update_subscription')}</Label2>
                    </Button>
                </NotificationFooter>
            </NotificationFooterPortal>
        </ContentWrapper>
    );
};

const ContentWrapper = styled.div`
    padding: 1rem 0;
    overflow: hidden;
`;

const NotificationStyled = styled(Notification)`
    max-width: 650px;
`;
