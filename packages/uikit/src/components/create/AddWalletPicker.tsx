import { FC, ReactNode, useEffect } from 'react';
import { isAccountCanManageMultisigs } from '@tonkeeper/core/dist/entries/account';
import { AddWalletMethod } from '@tonkeeper/core/src/entries/wallet';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useAccountsState, useActiveAccountQuery, useActiveConfig } from '../../state/wallet';
import { useAddWalletFlowAnalytics } from '../../hooks/analytics/wallet-flow';
import { Badge } from '../shared';
import { ChevronRightIcon } from '../Icon';
import IcChainTon20 from '../../icons/components/IcChainTon20';
import IcChainBtc20 from '../../icons/components/IcChainBtc20';
import IcChainEth20 from '../../icons/components/IcChainEth20';
import IcChainBsc20 from '../../icons/components/IcChainBsc20';
import IcEllipsis16 from '../../icons/components/IcEllipsis16';
import {
    WalletFireblocksIcon,
    WalletImportIcon,
    WalletKeystoneIcon,
    WalletLedgerIcon,
    WalletMagnifyingGlassIcon,
    WalletPencilIcon,
    WalletPlusIcon,
    WalletSignerIcon,
    WalletTestnetIcon
} from './WalletIcons';

/**
 * Picker for the "Add wallet" / "Import wallet" sheet.
 *
 * Two `mode`s share one component:
 *   - `'all'`  — everything the user can add (create / import / hardware /
 *                other). Used from the in-app entry points where existing
 *                users add another wallet.
 *   - `'import'` — only import-shaped entries (existing seed, hardware
 *                  pairings, watch-only, testnet). Used by the onboarding
 *                  start screen, where the multichain create flow lives
 *                  behind a separate primary action.
 *
 * Every entry is available whatever the active account is — legacy and
 * multichain accounts coexist in one switcher, so a multichain user can
 * still add a Ledger, a watch-only or a testnet wallet. What each entry
 * produces is decided by its own flow: create-standard follows
 * `multichainEnabled`, import follows the mnemonic shape, and the rest
 * always produce their legacy account type.
 */

export type AddWalletPickerMode = 'all' | 'import';

interface AddWalletEntryProps {
    icon: ReactNode;
    title: ReactNode;
    description: ReactNode;
    badge?: ReactNode;
    onClick: () => void;
}

const AddWalletEntry: FC<AddWalletEntryProps> = ({ icon, title, description, badge, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-medium border-0 bg-backgroundContent px-4 py-3.5 text-left transition-colors hover:bg-backgroundHighlighted active:bg-backgroundHighlighted"
    >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center text-accentBlue">
            {icon}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
            <span className="flex items-center gap-2 text-label1 text-textPrimary">
                {title}
                {badge}
            </span>
            <span className="text-body2 text-textSecondary">{description}</span>
        </span>
        <ChevronRightIcon className="shrink-0 text-iconTertiary" />
    </button>
);

const SectionDivider: FC<{ children: ReactNode }> = ({ children }) => (
    <p className="py-3 text-center text-body1 text-textSecondary">{children}</p>
);

const NETWORK_STACK_ICONS = [IcChainTon20, IcChainBtc20, IcChainEth20, IcChainBsc20];

/**
 * Overlapping row of the networks an imported seed can unlock, trailed by
 * an ellipsis for the rest. Badges stack in DOM order and each one masks
 * out a 2px halo around the spot where its neighbour lands, so the gap is a
 * transparent cutout (as in `ChainBadgeOverlay`) and whatever sits behind
 * the cell shows through, whether hover tint or surface.
 */
const NetworkStack = () => (
    <span className="flex items-center">
        {NETWORK_STACK_ICONS.map((Icon, i) => (
            <span
                key={i}
                className="-mr-0.5 h-[18px] w-[18px] shrink-0 overflow-hidden rounded-full [mask-image:radial-gradient(circle_at_25px_9px,transparent_10.5px,black_11px)]"
            >
                <Icon className="block h-[18px] w-[18px]" />
            </span>
        ))}
        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-backgroundContentTint text-iconSecondary">
            <IcEllipsis16 className="block h-3 w-3" />
        </span>
    </span>
);

export const AddWalletPicker: FC<{
    onSelect: (path: AddWalletMethod) => void;
    mode?: AddWalletPickerMode;
}> = ({ onSelect, mode = 'all' }) => {
    const { t } = useTranslation();
    const {
        hideSigner,
        hideLedger,
        hideKeystone,
        hideMultisig,
        hideFireblocks,
        multichainEnabled
    } = useAppContext();
    const signerDisabled = useActiveConfig().flags.disable_signer;

    const accounts = useAccountsState();
    const { data: activeAccount } = useActiveAccountQuery();

    const canHaveProSubscription = accounts.some(
        acc => acc.type === 'mnemonic' || acc.type === 'mam'
    );
    const canAddMultisig =
        accounts.some(acc => isAccountCanManageMultisigs(acc)) &&
        activeAccount?.type !== 'testnet' &&
        canHaveProSubscription;

    const { menuView } = useAddWalletFlowAnalytics();
    useEffect(() => {
        menuView();
    }, [menuView]);

    // Cells the user sees first — actively creating or importing a wallet.
    // The "Import wallet" mode shows only the import-shaped entries (existing
    // seed + hardware); "Add wallet" mode additionally shows the create-* /
    // multisig options at the top of this section.
    const primarySection: ReactNode[] = [];

    if (mode === 'all') {
        primarySection.push(
            <AddWalletEntry
                key="create-standard"
                icon={<WalletPlusIcon />}
                title={t('import_new_wallet')}
                description={t('import_new_wallet_description')}
                badge={multichainEnabled && <Badge color="accentBlue">{t('multichain')}</Badge>}
                onClick={() => onSelect('create-standard')}
            />
        );
    }

    primarySection.push(
        <AddWalletEntry
            key="import"
            icon={<WalletImportIcon />}
            title={t('import_wallet_picker_existing_title')}
            description={t('import_wallet_picker_existing_description')}
            badge={<NetworkStack />}
            onClick={() => onSelect('import')}
        />
    );

    if (mode === 'all' && canAddMultisig && !hideMultisig) {
        primarySection.push(
            <AddWalletEntry
                key="multisig"
                icon={<WalletPencilIcon />}
                title={t('add_wallet_new_multisig_title')}
                description={t('add_wallet_new_multisig_description')}
                badge={<Badge color="accentBlue">PRO</Badge>}
                onClick={() => onSelect('multisig')}
            />
        );
    }

    // Hardware-wallet pairings. The `'all'` mode surfaces them under a
    // "Hardware Wallets" header; the import sheet folds them into "Other
    // options" together with watch-only and testnet.
    const hardwareSection: ReactNode[] = [];
    if (!hideLedger) {
        hardwareSection.push(
            <AddWalletEntry
                key="ledger"
                icon={<WalletLedgerIcon />}
                title={t('ledger_pair_title')}
                description={t('ledger_pair_subtitle')}
                onClick={() => onSelect('ledger')}
            />
        );
    }
    if (!hideKeystone) {
        hardwareSection.push(
            <AddWalletEntry
                key="keystone"
                icon={<WalletKeystoneIcon />}
                title={t('keystone_pair_title')}
                description={t('keystone_pair_subtitle')}
                onClick={() => onSelect('keystone')}
            />
        );
    }
    if (!hideSigner && !signerDisabled) {
        hardwareSection.push(
            <AddWalletEntry
                key="signer"
                icon={<WalletSignerIcon />}
                title={t('import_signer')}
                description={t('import_signer_description')}
                onClick={() => onSelect('signer')}
            />
        );
    }

    const otherSection: ReactNode[] = [
        <AddWalletEntry
            key="watch-only"
            icon={<WalletMagnifyingGlassIcon />}
            title={t('add_wallet_modal_watch_only_title')}
            description={t('add_wallet_modal_watch_only_subtitle')}
            onClick={() => onSelect('watch-only')}
        />
    ];
    if (mode === 'all' && !hideFireblocks && canHaveProSubscription) {
        otherSection.push(
            <AddWalletEntry
                key="sk_fireblocks"
                icon={<WalletFireblocksIcon />}
                title={t('add_wallet_modal_fireblocks_title')}
                description={t('add_wallet_modal_fireblocks_description')}
                badge={<Badge color="accentBlue">PRO</Badge>}
                onClick={() => onSelect('sk_fireblocks')}
            />
        );
    }
    otherSection.push(
        <AddWalletEntry
            key="testnet"
            icon={<WalletTestnetIcon />}
            title={t('add_wallet_modal_testnet_title')}
            description={t('add_wallet_modal_testnet_subtitle')}
            onClick={() => onSelect('testnet')}
        />
    );

    return (
        <div className="mx-auto flex w-full max-w-[460px] flex-col gap-2">
            {primarySection}
            {mode === 'all' ? (
                <>
                    {hardwareSection.length > 0 && (
                        <SectionDivider>{t('add_wallet_group_hardware_title')}</SectionDivider>
                    )}
                    {hardwareSection}
                    <SectionDivider>{t('add_wallet_group_other_options')}</SectionDivider>
                    {otherSection}
                </>
            ) : (
                <>
                    <SectionDivider>{t('add_wallet_group_other_options')}</SectionDivider>
                    {hardwareSection}
                    {otherSection}
                </>
            )}
        </div>
    );
};
