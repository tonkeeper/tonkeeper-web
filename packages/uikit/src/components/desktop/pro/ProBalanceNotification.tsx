import { type FC } from 'react';
import { styled } from 'styled-components';
import { hasExpiresDate, isExtensionSubscription } from '@tonkeeper/core/dist/entries/pro';

import { Label2 } from '../../Text';
import { Button } from '../../fields/Button';
import { HideOnReview } from '../../ios/HideOnReview';
import { useTranslation } from '../../../hooks/translation';
import { ProSubscriptionHeader } from '../../pro/ProSubscriptionHeader';
import { Notification, NotificationFooter, NotificationFooterPortal } from '../../Notification';
import { ErrorBoundary } from '../../shared/ErrorBoundary';
import { fallbackRenderOver } from '../../Error';
import { useProState } from '../../../state/pro';
import { useDateTimeFormat } from '../../../hooks/useDateTimeFormat';

interface IProEndingNotificationProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProBalanceNotification: FC<IProEndingNotificationProps> = ({ isOpen, onClose }) => {
    const { data: subscription } = useProState();

    if (!isExtensionSubscription(subscription) || !hasExpiresDate(subscription)) return null;

    return (
        <HideOnReview>
            <NotificationStyled isOpen={isOpen} handleClose={onClose}>
                {() => (
                    <ErrorBoundary
                        fallbackRender={fallbackRenderOver('Failed to display Pro Balance modal')}
                    >
                        <ProBalanceNotificationContent
                            expiresDate={subscription.expiresDate}
                            onClose={onClose}
                        />
                    </ErrorBoundary>
                )}
            </NotificationStyled>
        </HideOnReview>
    );
};

interface IProEndingContentProps {
    onClose: () => void;
    expiresDate: Date;
}

export const ProBalanceNotificationContent: FC<IProEndingContentProps> = ({
    expiresDate,
    onClose: onCurrentClose
}) => {
    const { t } = useTranslation();
    const formatDate = useDateTimeFormat();

    return (
        <ContentWrapper>
            <ProSubscriptionHeader
                titleKey="pro_is_ending"
                subtitleKey="not_enough_balance_reminder"
                subtitleKeyReplaces={{
                    date: formatDate(expiresDate, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    })
                }}
            />
            <NotificationFooterPortal>
                <NotificationFooter>
                    <Button primary fullWidth onClick={onCurrentClose}>
                        <Label2>{t('close')}</Label2>
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
