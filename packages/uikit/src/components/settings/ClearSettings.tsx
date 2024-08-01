import React, { useMemo, useState } from 'react';
import { useTranslation } from '../../hooks/translation';
import { DeleteAllNotification } from './DeleteAccountNotification';
import { DeleteAccountIcon } from './SettingsIcons';
import { SettingsList } from './SettingsList';
import { useAccountsState } from '../../state/wallet';

export const ClearSettings = () => {
    const { t } = useTranslation();

    const wallets = useAccountsState();
    const [open, setOpen] = useState(false);
    const deleteItems = useMemo(() => {
        return [
            {
                name:
                    wallets.length > 1
                        ? t('Delete_all_accounts_and_logout')
                        : t('settings_delete_account'),
                icon: <DeleteAccountIcon />,
                action: () => setOpen(true)
            }
        ];
    }, [t, setOpen]);

    return (
        <>
            <SettingsList items={deleteItems} />
            <DeleteAllNotification open={open} handleClose={() => setOpen(false)} />
        </>
    );
};
