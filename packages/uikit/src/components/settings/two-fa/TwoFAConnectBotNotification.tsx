import { Notification } from '../../Notification';
import { FC } from 'react';
import { useTwoFAWalletConfig } from '../../../state/two-fa';
import { Body2, H2Label2Responsive } from '../../Text';
import { useTranslation } from '../../../hooks/translation';
import styled from 'styled-components';
import { BorderSmallResponsive } from '../../shared/Styles';
import { QRCode } from 'react-qrcode-logo';
import { Button } from '../../fields/Button';
import { useAppSdk } from '../../../hooks/appSdk';
import { TelegramIcon } from '../../Icon';

const NotificationStyled = styled(Notification)`
    .dialog-header {
        padding-bottom: 0;
    }
`;

export const TwoFAConnectBotNotification: FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    const { data: config } = useTwoFAWalletConfig();

    const authLink = config?.status === 'tg-bot-bounding' ? config.authUrl : undefined;

    return (
        <NotificationStyled isOpen={isOpen} handleClose={onClose}>
            {() => authLink && <TwoFAConnectBotNotificationContent tgLink={authLink} />}
        </NotificationStyled>
    );
};

export const TwoFAReConnectBotNotification: FC<{
    isOpen: boolean;
    onClose: () => void;
    authLink?: string;
}> = ({ isOpen, onClose, authLink }) => {
    return (
        <NotificationStyled isOpen={isOpen} handleClose={onClose}>
            {() => authLink && <TwoFAConnectBotNotificationContent tgLink={authLink} reconnect />}
        </NotificationStyled>
    );
};

const Heading = styled(H2Label2Responsive)`
    text-align: center;
    max-width: 304px;
    margin: 0 auto;
`;

const QRWrapper = styled.div`
    padding: 2rem 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: ${p => p.theme.backgroundContent};
    ${BorderSmallResponsive};
    margin-bottom: 1rem;
    margin-top: 1rem;
`;

const QRBackground = styled.div`
    background-color: ${p => p.theme.textPrimary};
    ${BorderSmallResponsive};
    padding: 0.5rem;
`;

const ButtonsContainer = styled.div`
    display: flex;
    gap: 8px;
    width: 100%;
    flex-direction: column;
`;

const TelegramIconStyled = styled(TelegramIcon)`
    color: ${p => p.theme.buttonPrimaryForeground};
`;

const Body2Styled = styled(Body2)`
    margin-top: 4px;
    color: ${p => p.theme.textSecondary};
`;

const TwoFAConnectBotNotificationContent: FC<{ tgLink: string; reconnect?: boolean }> = ({
    tgLink,
    reconnect
}) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    return (
        <div>
            <Heading>
                {reconnect
                    ? t('two_fa_settings_reconnect_tg_connection_modal_heading')
                    : t('two_fa_settings_set_up_tg_connection_modal_heading')}
            </Heading>
            {reconnect && (
                <Body2Styled>
                    {t('two_fa_settings_reconnect_tg_connection_modal_description')}
                </Body2Styled>
            )}
            <QRWrapper>
                <QRBackground>
                    <QRCode value={tgLink} bgColor="transparent" />
                </QRBackground>
            </QRWrapper>
            <ButtonsContainer>
                <Button primary onClick={() => sdk.openPage(tgLink)}>
                    <TelegramIconStyled />
                    {t('two_fa_settings_set_up_tg_connection_modal_open_button')}
                </Button>
                <Button secondary onClick={() => sdk.copyToClipboard(tgLink, t('copied'))}>
                    {t('two_fa_settings_set_up_tg_connection_modal_copy_button')}
                </Button>
            </ButtonsContainer>
        </div>
    );
};
