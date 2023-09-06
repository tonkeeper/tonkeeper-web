import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { DeleteAllNotification } from './LogOutNotification';
import { DeleteAccountIcon } from './SettingsIcons';
import { SettingsList } from './SettingsList';

export const ClearSettings = () => {
    const { t } = useTranslation();

    const { account } = useAppContext();
    const [open, setOpen] = useState(false);
    const deleteItems = useMemo(() => {
        return [
            {
                name:
                    account.publicKeys.length > 1
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
