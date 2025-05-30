import { WalletVersionSettingsNotification } from './modals/WalletVersionSettingsNotification';
import { LedgerIndexesSettingsNotification } from './modals/LedgerIndexesSettingsNotification';
import { ProFeaturesNotificationControlled } from './modals/ProFeaturesNotificationControlled';
import { MAMIndexesSettingsNotification } from './modals/MAMIndexesSettingsNotification';
import { RenameNotificationControlled } from './modals/RenameNotificationControlled';
import { RecoveryNotificationControlled } from './modals/RecoveryNotificationControlled';
import { AddWalletNotificationControlled } from './modals/AddWalletNotificationControlled';
import { ConfirmDiscardNotificationControlled } from './modals/ConfirmDiscardNotificationControlled';
import { MultisigOrderNotificationControlled } from './modals/MultisigOrderNotificationControlled';
import { DeleteAccountNotificationControlled } from './modals/DeleteAccountNotificationControlled';
import { ManageFolderNotificationControlled } from './modals/ManageFolderNotificationControlled';
import { ConfirmTwoFANotificationControlled } from './modals/ConfirmTwoFANotificationControlled';
import { BuyNotificationControlled } from './modals/BuyNotificationControlled';
import { PromptMobileProPinNotificationControlled } from './modals/PromptMobileProPin';
import { CheckDesktopPasswordControlled } from './modals/PromptDesktopPassword';
import { TonTransactionNotificationControlled } from './modals/TonTransactionNotificationControlled';
import { MAMTronMigrationNotification } from './modals/MAMTronMigrationNotificationControlled';

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
            <DeleteAccountNotificationControlled />
            <ManageFolderNotificationControlled />
            <ConfirmTwoFANotificationControlled />
            <BuyNotificationControlled />
            <PromptMobileProPinNotificationControlled />
            <CheckDesktopPasswordControlled />
            <TonTransactionNotificationControlled />
            <MAMTronMigrationNotification />
        </>
    );
};
