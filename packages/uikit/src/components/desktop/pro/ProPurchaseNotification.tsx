import { FC } from 'react';
import { styled } from 'styled-components';

import { Notification } from '../../Notification';
import { useProState } from '../../../state/pro';
import { SubscriptionPurchaseProvider } from '../../../providers/SubscriptionPurchaseProvider';
import { PurchaseSubscriptionScreens } from '../../../enums/pro';
import { ProAccountChooseScreen } from '../../pro/ProAccountChooseScreen';
import { ProPurchaseChooseScreen } from '../../pro/ProPurchaseChooseScreen';
import { usePurchaseSubscriptionScreen } from '../../../hooks/pro/usePurchaseSubscriptionScreen';

interface IProPurchaseNotificationProps {
    isOpen: boolean;
    onClose: () => void;
    initialScreen?: PurchaseSubscriptionScreens;
}

export const ProPurchaseNotification: FC<IProPurchaseNotificationProps> = props => {
    const { isOpen, onClose, initialScreen } = props;

    return (
        <NotificationStyled mobileFullScreen isOpen={isOpen} handleClose={onClose}>
            {() => (
                <SubscriptionPurchaseProvider onClose={onClose} initialScreen={initialScreen}>
                    <ProPurchaseNotificationContent />
                </SubscriptionPurchaseProvider>
            )}
        </NotificationStyled>
    );
};

const SCREENS_MAP = {
    [PurchaseSubscriptionScreens.ACCOUNTS]: <ProAccountChooseScreen />,
    [PurchaseSubscriptionScreens.PURCHASE]: <ProPurchaseChooseScreen />
};

export const ProPurchaseNotificationContent = () => {
    const { data } = useProState();

    const { currentScreen } = usePurchaseSubscriptionScreen();

    if (!data) {
        return null;
    }

    return SCREENS_MAP[currentScreen];
};

const NotificationStyled = styled(Notification)`
    max-width: 520px;
`;
