import { FC } from 'react';
import { Notification } from '../Notification';
import styled from 'styled-components';
import { Body2, Label2 } from '../Text';
import { Button } from '../fields/Button';
import { useActivateTrialMutation } from '../../state/pro';
import { TelegramIcon } from '../Icon';
import { useTranslation } from '../../hooks/translation';

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 360px;
    margin: 0 auto;
    padding-bottom: 8px;

    & > ${Body2} {
        color: ${props => props.theme.textSecondary};
    }
`;

const FooterStyled = styled.div`
    padding: 1rem 0;
`;

const ButtonStyled = styled(Button)`
    display: flex;
    gap: 0.5rem;
    justify-content: center;
`;

const ImageStyled = styled.img`
    width: 56px;
    height: 56px;
    margin-bottom: 1rem;
`;

export const ProTrialStartNotification: FC<{
    isOpen: boolean;
    onClose: (confirmed?: boolean) => void;
}> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const { mutateAsync, isLoading } = useActivateTrialMutation();

    const onConfirm = async () => {
        const result = await mutateAsync();
        onClose(result);
    };

    return (
        <Notification
            isOpen={isOpen}
            handleClose={() => onClose()}
            footer={
                <FooterStyled>
                    <ButtonStyled primary fullWidth loading={isLoading} onClick={onConfirm}>
                        <TelegramIcon />
                        {t('connect_telegram')}
                    </ButtonStyled>
                </FooterStyled>
            }
        >
            {() => (
                <ContentWrapper>
                    <ImageStyled src="https://tonkeeper.com/assets/icon.ico" />
                    <Label2>{t('start_trial_notification_heading')}</Label2>
                    <Body2>{t('start_trial_notification_description')}</Body2>
                </ContentWrapper>
            )}
        </Notification>
    );
};
