import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../hooks/translation';
import styled from 'styled-components';
import { Body2 } from '../Text';
import { Button } from '../fields/Button';
import { Notification } from '../Notification';
import { useAppSdk } from '../../hooks/appSdk';
import { useKeychainSecuritySettings } from '../../state/password';
import { AppRoute, SettingsRoute } from '../../libs/routes';
import { useNavigate } from '../../hooks/router/useNavigate';

const setupPasswordQueryKey = 'setup-password-date';

const useLastReminedDate = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();

    const { data } = useQuery<number | null>([setupPasswordQueryKey], async () => {
        const date = await sdk.storage.get<number>(setupPasswordQueryKey);
        if (!date) {
            return null;
        }

        return date;
    });

    const setLastReminedDate = useMutation(async () => {
        await sdk.storage.set<number>(setupPasswordQueryKey, Date.now());
        await client.invalidateQueries([setupPasswordQueryKey]);
    });

    return [data, setLastReminedDate.mutateAsync] as const;
};

const reminderInterval = 30 * 24 * 60 * 60 * 1000; // every 30 days
export const SecureWalletNotification = () => {
    const [date, setDate] = useLastReminedDate();
    const { password: keychainPassword } = useKeychainSecuritySettings();
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useTranslation();
    const navigate = useNavigate();

    useEffect(() => {
        if (date === undefined) {
            return;
        }

        if (!date || Date.now() - date >= reminderInterval) {
            setIsOpen(true);
        }
    }, [date, keychainPassword]);

    if (keychainPassword) {
        return null;
    }

    const onClose = () => {
        setIsOpen(false);
        setDate();
    };

    const onSetPassword = () => {
        onClose();
        navigate(AppRoute.settings + SettingsRoute.security + '?open-password-notification=true');
    };

    return (
        <NotificationStyled
            isOpen={isOpen}
            handleClose={onClose}
            title={t('secure_wallet_reminder_title')}
        >
            {() => (
                <Wrapper>
                    <Body2Styled>{t('secure_wallet_reminder_description')}</Body2Styled>
                    <Button primary fullWidth onClick={onSetPassword}>
                        {t('secure_wallet_reminder_btn_set')}
                    </Button>
                    <Button secondary fullWidth onClick={onClose}>
                        {t('secure_wallet_reminder_btn_skip')}
                    </Button>
                </Wrapper>
            )}
        </NotificationStyled>
    );
};

const NotificationStyled = styled(Notification)`
    max-width: 400px;
`;

const Body2Styled = styled(Body2)`
    color: ${props => props.theme.textSecondary};
    margin-bottom: 16px;
`;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;
