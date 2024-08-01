import { Notification } from '../Notification';
import { WalletVersionPageContent } from '../../pages/settings/Version';
import { useAtom } from '../../libs/atom';
import { useTranslation } from '../../hooks/translation';
import { AccountId } from '@tonkeeper/core/dist/entries/account';
import { createModalControl } from './createModalControl';

const { hook, paramsControl } = createModalControl<{ accountId?: AccountId }>();

export const useWalletVersionSettingsNotification = hook;

export const WalletVersionSettingsNotification = () => {
    const { isOpen, onClose } = useWalletVersionSettingsNotification();
    const { t } = useTranslation();
    const [params] = useAtom(paramsControl);

    return (
        <Notification title={t('settings_version')} isOpen={isOpen} handleClose={() => onClose()}>
            {() => (
                <WalletVersionPageContent
                    afterWalletOpened={onClose}
                    accountId={params?.accountId}
                />
            )}
        </Notification>
    );
};
