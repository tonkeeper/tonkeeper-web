import { WalletVersionSettingsNotification } from './modals/WalletVersionSettingsNotification';
import { LedgerIndexesSettingsNotification } from './modals/LedgerIndexesSettingsNotification';
import { ProFeaturesNotificationControlled } from './modals/ProFeaturesNotificationControlled';
import { MAMIndexesSettingsNotification } from './modals/MAMIndexesSettingsNotification';
import { RenameNotificationControlled } from './modals/RenameNotificationControlled';
import { RecoveryNotificationControlled } from './modals/RecoveryNotificationControlled';
import { AddWalletNotificationControlled } from './modals/AddWalletNotificationControlled';
import { ConfirmDiscardNotificationControlled } from './modals/ConfirmDiscardNotificationControlled';
import { MultisigOrderNotificationControlled } from './modals/MultisigOrderNotificationControlled';
import { MultisigChangeConfigNotificationControlled } from './modals/MultisigChangeConfigNotificationControlled';

export const ModalsRoot = () => {
    return (
        <>
            <WalletVersionSettingsNotification />
            <LedgerIndexesSettingsNotification />
            <ProFeaturesNotificationControlled />
            <MAMIndexesSettingsNotification />
            <RenameNotificationControlled />
            <RecoveryNotificationControlled />
            <AddWalletNotificationControlled />
            <ConfirmDiscardNotificationControlled />
            <MultisigOrderNotificationControlled />
            <MultisigChangeConfigNotificationControlled />
        </>
    );
};
