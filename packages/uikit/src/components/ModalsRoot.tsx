import { WalletVersionSettingsNotification } from './modals/WalletVersionSettingsNotification';
import { LedgerIndexesSettingsNotification } from './modals/LedgerIndexesSettingsNotification';
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
import { ProEndingNotificationControlled } from './modals/ProEndingNotificationControlled';
import { ProPurchaseNotificationControlled } from './modals/ProPurchaseNotificationControlled';

export const ModalsRoot = () => {
    return (
        <>
            <WalletVersionSettingsNotification />
            <LedgerIndexesSettingsNotification />
            <ProPurchaseNotificationControlled />
            <ProEndingNotificationControlled />
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
