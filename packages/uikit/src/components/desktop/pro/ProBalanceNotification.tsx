import { type FC } from 'react';
import { styled } from 'styled-components';

import { Label2 } from '../../Text';
import { Button } from '../../fields/Button';
import { HideOnReview } from '../../ios/HideOnReview';
import { useTranslation } from '../../../hooks/translation';
import { ProSubscriptionHeader } from '../../pro/ProSubscriptionHeader';
import { Notification, NotificationFooter, NotificationFooterPortal } from '../../Notification';
import { ErrorBoundary } from '../../shared/ErrorBoundary';
import { fallbackRenderOver } from '../../Error';

interface IProEndingNotificationProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProBalanceNotification: FC<IProEndingNotificationProps> = ({ isOpen, onClose }) => (
    <HideOnReview>
        <NotificationStyled isOpen={isOpen} handleClose={onClose}>
            {() => (
                <ErrorBoundary
                    fallbackRender={fallbackRenderOver('Failed to display Pro Balance modal')}
                >
                    <ProBalanceNotificationContent onClose={onClose} />
                </ErrorBoundary>
            )}
        </NotificationStyled>
    </HideOnReview>
);

export const ProBalanceNotificationContent: FC<Pick<IProEndingNotificationProps, 'onClose'>> = ({
    onClose: onCurrentClose
}) => {
    const { t } = useTranslation();

    return (
        <ContentWrapper>
            <ProSubscriptionHeader
                titleKey="pro_is_ending"
                subtitleKey="not_enough_balance_reminder"
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
