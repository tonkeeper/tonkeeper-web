import { Notification } from '../Notification';
import { useAtom } from '../../libs/atom';
import { useTranslation } from '../../hooks/translation';
import { AccountId } from '@tonkeeper/core/dist/entries/account';
import { createModalControl } from './createModalControl';
import { LedgerIndexesPageContent } from '../../pages/settings/LedgerIndexes';
import { useAccountState } from '../../state/wallet';

const { hook, control } = createModalControl<{ accountId: AccountId }>();

export const useLedgerIndexesSettingsNotification = hook;

export const LedgerIndexesSettingsNotification = () => {
    const { isOpen, onClose } = useLedgerIndexesSettingsNotification();
    const { t } = useTranslation();
    const [params] = useAtom(control);
    const account = useAccountState(params?.accountId);
    if (!account || account.type !== 'ledger') {
        return null;
    }

    return (
        <Notification
            title={t('settings_ledger_indexes')}
            isOpen={!!isOpen}
            handleClose={() => onClose()}
        >
            {() => <LedgerIndexesPageContent afterWalletOpened={onClose} account={account} />}
        </Notification>
    );
};
