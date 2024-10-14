import { Notification } from '../../Notification';
import { FC } from 'react';
import { useTranslation } from '../../../hooks/translation';
import styled from 'styled-components';
import { ListItem, ListItemElement } from '../../List';

export const BatteryRechargeNotification: FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    const { t } = useTranslation();

    return (
        <Notification
            isOpen={isOpen}
            handleClose={onClose}
            title={t('battery_recharge_by_crypto_title')}
        >
            {() => <BatteryRechargeNotificationContent />}
        </Notification>
    );
};

const ContentWrapper = styled.div``;

const BatteryRechargeNotificationContent = () => {
    return (
        <ContentWrapper>
            <AssetSelect />
        </ContentWrapper>
    );
};

const AssetImage = styled.img`
    border-radius: ${p => p.theme.cornerFull};
    width: 24px;
    height: 24px;
`;

const AssetSelect = () => {
    return (
        <ListItem hover={false}>
            <ListItemElement>
                <AssetImage />
            </ListItemElement>
        </ListItem>
    );
};
