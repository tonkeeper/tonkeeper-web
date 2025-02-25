import React, { FC } from 'react';
import { Notification } from '../../Notification';

import { useTranslation } from '../../../hooks/translation';
import styled from 'styled-components';
import { Body2, H2Label2Responsive } from '../../Text';
import { Button } from '../../fields/Button';

const NotificationStyled = styled(Notification)`
    .dialog-content {
        max-width: 500px;
    }

    .dialog-header {
        padding-bottom: 0;
    }
`;

export const DisableTwoFAConfirmNotification: FC<{
    isOpen: boolean;
    onClose: (confirmed: boolean) => void;
}> = ({ isOpen, onClose }) => {
    return (
        <NotificationStyled isOpen={isOpen} handleClose={() => onClose(false)}>
            {() => <NotificationContent onClose={onClose} />}
        </NotificationStyled>
    );
};

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    text-align: center;
`;

const Body2Secondary = styled(Body2)`
    color: ${p => p.theme.textSecondary};
    margin-bottom: 24px;
`;

const ButtonsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
`;

const NotificationContent: FC<{
    onClose: (confirmed: boolean) => void;
}> = ({ onClose }) => {
    const { t } = useTranslation();

    return (
        <Wrapper>
            <H2Label2Responsive>{t('confirm_disable_two_fa_title')}</H2Label2Responsive>
            <Body2Secondary>{t('confirm_disable_two_fa_description')}</Body2Secondary>
            <ButtonsContainer>
                <Button primary fullWidth onClick={() => onClose(true)}>
                    {t('confirm_disable_two_fa_ok_button')}
                </Button>
                <Button secondary fullWidth onClick={() => onClose(false)}>
                    {t('cancel')}
                </Button>
            </ButtonsContainer>
        </Wrapper>
    );
};
