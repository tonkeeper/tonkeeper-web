import { WalletVersionSettingsNotification } from './modals/WalletVersionSettingsNotification';
import { LedgerIndexesSettingsNotification } from './modals/LedgerIndexesSettingsNotification';
import { ProFeaturesNotificationControlled } from './modals/ProFeaturesNotificationControlled';

export const ModalsRoot = () => {
    return (
        <>
            <WalletVersionSettingsNotification />
            <LedgerIndexesSettingsNotification />
            <ProFeaturesNotificationControlled />
        </>
    );
};
