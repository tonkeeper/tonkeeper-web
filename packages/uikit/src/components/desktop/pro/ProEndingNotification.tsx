import { type FC } from 'react';
import { styled } from 'styled-components';

import { Label2 } from '../../Text';
import { Button } from '../../fields/Button';
import { HideOnReview } from '../../ios/HideOnReview';
import { useTranslation } from '../../../hooks/translation';
import { AppRoute, SettingsRoute } from '../../../libs/routes';
import { useNavigate } from '../../../hooks/router/useNavigate';
import { ProSubscriptionHeader } from '../../pro/ProSubscriptionHeader';
import { Notification, NotificationFooter, NotificationFooterPortal } from '../../Notification';

interface IProEndingNotificationProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProEndingNotification: FC<IProEndingNotificationProps> = ({ isOpen, onClose }) => (
    <HideOnReview>
        <NotificationStyled isOpen={isOpen} handleClose={onClose}>
            {() => <ProEndingNotificationContent onClose={onClose} />}
        </NotificationStyled>
    </HideOnReview>
);

export const ProEndingNotificationContent: FC<Pick<IProEndingNotificationProps, 'onClose'>> = ({
    onClose
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handlePurchaseClick = () => {
        onClose();
        navigate(AppRoute.settings + SettingsRoute.pro);
    };

    return (
        <ContentWrapper>
            <ProSubscriptionHeader titleKey="pro_is_ending" subtitleKey="stay_with_tonkeeper_pro" />
            <NotificationFooterPortal>
                <NotificationFooter>
                    <Button primary fullWidth onClick={handlePurchaseClick}>
                        <Label2>{t('get_tonkeeper_pro')}</Label2>
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
    max-width: 520px;
`;
