import { Notification } from '../Notification';
import { useCallback } from 'react';
import { WalletVersionPageContent } from '../../pages/settings/Version';
import { atom, useAtom } from '../../libs/atom';
import { useTranslation } from '../../hooks/translation';

const walletVersionSettingsNotificationIsOpen = atom(false);

export const useWalletVersionSettingsNotification = () => {
    const [isOpen, setIsOpen] = useAtom(walletVersionSettingsNotificationIsOpen);

    return {
        isOpen,
        onOpen: useCallback(() => setIsOpen(true), []),
        onClose: useCallback(() => setIsOpen(false), [])
    };
};

export const WalletVersionSettingsNotification = () => {
    const { isOpen, onClose } = useWalletVersionSettingsNotification();
    const { t } = useTranslation();

    return (
        <Notification title={t('settings_version')} isOpen={isOpen} handleClose={() => onClose()}>
            {() => <WalletVersionPageContent afterWalletOpened={onClose} />}
        </Notification>
    );
};
