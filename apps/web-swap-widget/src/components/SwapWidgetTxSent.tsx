import { Notification } from '@tonkeeper/uikit/dist/components/Notification';
import { FC } from 'react';
import styled, { useTheme } from 'styled-components';
import { Body2, Button, Label2 } from '@tonkeeper/uikit';
import { useTranslation } from 'react-i18next';

const NotificationStyled = styled(Notification)`
    .dialog-header {
        margin-bottom: 0;
    }
`;

export const SwapWidgetTxSentNotification: FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    return (
        <NotificationStyled isOpen={isOpen} handleClose={onClose}>
            {() => <SwapWidgetTxSentNotificationContent onClose={onClose} />}
        </NotificationStyled>
    );
};

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding-bottom: 46px;
`;

const CheckmarkCircleIcon = () => {
    const theme = useTheme();

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
            style={{ marginBottom: '12px' }}
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M28 50.0001C40.1503 50.0001 50 40.1504 50 28.0001C50 15.8499 40.1503 6.00012 28 6.00012C15.8497 6.00012 6 15.8499 6 28.0001C6 40.1504 15.8497 50.0001 28 50.0001ZM38.0607 24.0608C38.6464 23.475 38.6464 22.5252 38.0607 21.9395C37.4749 21.3537 36.5251 21.3537 35.9393 21.9395L25 32.8788L21.0607 28.9395C20.4749 28.3537 19.5251 28.3537 18.9393 28.9395C18.3536 29.5252 18.3536 30.475 18.9393 31.0608L23.9393 36.0608C24.5251 36.6466 25.4749 36.6466 26.0607 36.0608L38.0607 24.0608Z"
                fill={theme.accentGreen}
            />
            <path
                opacity="0.32"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M38.0607 21.9395C38.6464 22.5252 38.6464 23.475 38.0607 24.0608L26.0607 36.0608C25.4749 36.6466 24.5251 36.6466 23.9393 36.0608L18.9393 31.0608C18.3536 30.475 18.3536 29.5252 18.9393 28.9395C19.5251 28.3537 20.4749 28.3537 21.0607 28.9395L25 32.8788L35.9393 21.9395C36.5251 21.3537 37.4749 21.3537 38.0607 21.9395Z"
                fill={theme.accentGreen}
            />
        </svg>
    );
};

const Body2Secondary = styled(Body2)`
    color: ${p => p.theme.textSecondary};
    margin-bottom: 24px;
    margin-top: 4px;
`;

const SwapWidgetTxSentNotificationContent: FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useTranslation();
    return (
        <Wrapper>
            <CheckmarkCircleIcon />
            <Label2>{t('swap_transaction_sent_title')}</Label2>
            <Body2Secondary>{t('swap_transaction_sent_description')}</Body2Secondary>
            <Button fullWidth onClick={onClose}>
                {t('swap_transaction_sent_close_button')}
            </Button>
        </Wrapper>
    );
};
