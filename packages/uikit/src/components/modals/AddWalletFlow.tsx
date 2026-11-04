import { lazy, ReactElement, Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import { AddWalletContext } from '../create/AddWalletContext';
import { AddWalletPicker, AddWalletPickerMode } from '../create/AddWalletPicker';
import { createModalControl } from './createModalControl';
import { useAppSdk } from '../../hooks/appSdk';
import { useAtom } from '../../libs/useAtom';
import { useProFeaturesNotification } from './ProFeaturesNotificationControlled';
import { useProState } from '../../state/pro';
import { useSecurityCheck } from '../../state/password';
import { useAccountsStateQuery } from '../../state/wallet';
import { useTranslation } from '../../hooks/translation';
import type { AddWalletSource } from '../../hooks/analytics/wallet-flow';

import { AddWalletMethod } from '@tonkeeper/core/dist/entries/wallet';
import { isValidSubscription } from '@tonkeeper/core/dist/entries/pro';
import type { IAppSdk } from '@tonkeeper/core/dist/AppSdk';

import { Loader } from '../../primitives/Loader';
import { Modal } from '../../primitives/Modal';

/**
 * The "Add wallet" flow modal — owns the picker plus every per-method
 * onboarding screen (create / MAM / import / watch-only / signer /
 * keystone / ledger / SK-fireblocks / multisig / testnet). Opened
 * imperatively via `useAddWalletFlow` from every "+ add wallet" entry
 * point in the app (header, sidebar, start screen, settings, etc).
 *
 * Per-method screens are code-split via `React.lazy`, so the initial
 * bundle ships only the picker. Clicking a method fetches that
 * method's chunk on demand — keeping the Ledger USB transport, the
 * multisig contract encoder, the Fireblocks SDK, BIP39 wordlists, and
 * other heavy onboarding deps off the cold-start path.
 */

// ─── Per-method screens (lazy) ─────────────────────────────────────

const loadCreateStandardWallet = () => import('../../pages/import/CreateStandardWallet');
const loadImportExistingWallet = () => import('../../pages/import/ImportExistingWallet');

/**
 * Warm the create / import chunks so opening the flow renders the first
 * step instead of the Suspense spinner. The start screen calls both on
 * mount: a first-time user has a cold cache, and the fetch otherwise runs
 * only after they click "Create" / "Import". The picker warms the import
 * chunk as soon as it opens, since the mnemonic form is where most picks
 * land.
 */
export const preloadCreateStandardWallet = () => {
    loadCreateStandardWallet().catch(() => {});
};
export const preloadImportExistingWallet = () => {
    loadImportExistingWallet().catch(() => {});
};

const CreateStandardWallet = lazy(() =>
    loadCreateStandardWallet().then(m => ({ default: m.CreateStandardWallet }))
);
const ImportExistingWallet = lazy(() =>
    loadImportExistingWallet().then(m => ({ default: m.ImportExistingWallet }))
);
const ImportTestnetWallet = lazy(() =>
    import('../../pages/import/ImportTestnetWallet').then(m => ({
        default: m.ImportTestnetWallet
    }))
);
const CreateWatchOnlyWallet = lazy(() =>
    import('../../pages/import/CreateWatchOnlyWallet').then(m => ({
        default: m.CreateWatchOnlyWallet
    }))
);
const CreateSignerWallet = lazy(() =>
    import('../../pages/import/CreateSignerWallet').then(m => ({ default: m.CreateSignerWallet }))
);
const CreateKeystoneWallet = lazy(() =>
    import('../../pages/import/CreateKeystoneWallet').then(m => ({
        default: m.CreateKeystoneWallet
    }))
);
const CreateLedgerWallet = lazy(() =>
    import('../../pages/import/CreateLedgerWallet').then(m => ({ default: m.CreateLedgerWallet }))
);
const CreateMultisig = lazy(() =>
    import('../create/Multisig').then(m => ({ default: m.CreateMultisig }))
);
const ImportBySKWallet = lazy(() =>
    import('../../pages/import/ImportBySKWallet').then(m => ({ default: m.ImportBySKWallet }))
);

/**
 * Map of `AddWalletMethod` → renderer. Each renderer takes a single
 * `completed` callback and returns the per-method screen. Inlining
 * the JSX here smooths over each component's slightly different
 * prop shape (most take `afterCompleted`; multisig takes `onClose`;
 * sk-fireblocks needs a `signingAlgorithm` literal) without forcing
 * every screen to grow an adapter.
 *
 * The `Record<AddWalletMethod, …>` type also serves as the
 * exhaustiveness check the old `switch` used `assertUnreachable` for —
 * adding a new method to the union forces an entry here.
 */
const renderMethod: Record<AddWalletMethod, (completed: () => void) => ReactElement> = {
    'create-standard': cb => <CreateStandardWallet afterCompleted={cb} />,
    import: cb => <ImportExistingWallet afterCompleted={cb} />,
    testnet: cb => <ImportTestnetWallet afterCompleted={cb} />,
    'watch-only': cb => <CreateWatchOnlyWallet afterCompleted={cb} />,
    signer: cb => <CreateSignerWallet afterCompleted={cb} />,
    keystone: cb => <CreateKeystoneWallet afterCompleted={cb} />,
    ledger: cb => <CreateLedgerWallet afterCompleted={cb} />,
    multisig: cb => <CreateMultisig onClose={cb} />,
    sk_fireblocks: cb => <ImportBySKWallet signingAlgorithm="fireblocks" afterCompleted={cb} />
};

// ─── Open params & modal control ──────────────────────────────────

type OpenParams = {
    walletType?: AddWalletMethod;
    /**
     * `'import'` narrows the picker to import-shaped entries — used
     * from the onboarding start screen, which has a separate primary
     * action for the create flow. Defaults to `'all'`.
     */
    pickerMode?: AddWalletPickerMode;
    /**
     * Override for the funnel's `from`. Only needed by callers that open the
     * flow before the accounts query has resolved, where "does the user have
     * wallets already?" can't be read off state yet.
     */
    analyticsFrom?: AddWalletSource;
};

type InternalOpenParams = Omit<OpenParams, 'analyticsFrom'> & { analyticsFrom: AddWalletSource };

const { hook, paramsControl } = createModalControl<InternalOpenParams | undefined>();

const requiresPro = (m: AddWalletMethod): boolean => m === 'multisig' || m === 'sk_fireblocks';

/**
 * `create-standard` and `import` verify the app password inside their
 * own wizard (`PasswordStep`) on platforms without an OS keychain —
 * running the generic pre-flight security check as well would prompt
 * for the password twice in a row. Keychain platforms skip
 * `PasswordStep`, so they still need the biometric check before the
 * wizard touches secret material.
 */
const methodRunsOwnSecurityCheck = (m: AddWalletMethod, sdk: IAppSdk): boolean =>
    (m === 'create-standard' || m === 'import') && !sdk.keychain;

// ─── Public hook ──────────────────────────────────────────────────

/**
 * Imperative open / close handle for the Add Wallet modal. When
 * `walletType` is preselected, the hook runs a security check first
 * (password / mnemonic confirm) so the modal can skip its own auth
 * gate. `skipSecurityCheck` bypasses that — used by the extension's
 * new-tab auto-mount path, where the popup already verified the user
 * before spawning a fresh tab.
 */
export const useAddWalletFlow = () => {
    const sdk = useAppSdk();
    const { mutateAsync: securityCheck } = useSecurityCheck();
    const { onOpen: openModal, ...rest } = hook();
    // The query form, not `useAccountsState()`: this hook runs from globally
    // mounted chrome that can render before the accounts query resolves.
    const hasAccounts = !!useAccountsStateQuery().data?.length;

    const onOpen = useCallback(
        async (params?: OpenParams & { skipSecurityCheck?: boolean }) => {
            try {
                if (
                    params?.walletType &&
                    !params.skipSecurityCheck &&
                    !methodRunsOwnSecurityCheck(params.walletType, sdk)
                ) {
                    await securityCheck();
                }
                // Resolved once, here: by the time the flow finishes the app
                // always has accounts, so "was this first-run onboarding?" is
                // only answerable at open time.
                openModal({
                    ...params,
                    analyticsFrom: params?.analyticsFrom ?? (hasAccounts ? 'main' : 'onboarding')
                });
            } catch (e) {
                console.error(e);
            }
        },
        [securityCheck, openModal, hasAccounts, sdk]
    );

    return { ...rest, onOpen };
};

// ─── Modal component ──────────────────────────────────────────────

export const AddWalletFlow = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { mutateAsync: securityCheck } = useSecurityCheck();
    const { isOpen, onClose, onOpen } = useAddWalletFlow();
    const [params] = useAtom(paramsControl);

    const { onOpen: openBuyPro } = useProFeaturesNotification();
    const { data: subscription } = useProState();
    const hasValidPro = isValidSubscription(subscription);

    const [selectedMethod, setSelectedMethod] = useState<AddWalletMethod | undefined>(
        params?.walletType
    );

    // Extension new-tab auto-mount: when the popup spawned a fresh
    // tab with `?add_wallet=:method`, the SDK exposes that method
    // here. Auto-open the modal and skip the security check — the
    // popup already authenticated the user before opening the tab.
    useEffect(() => {
        const autoMount = sdk.addWalletPage?.getAutoMountMethod();
        if (autoMount) {
            // This tab was spawned from the popup of an app that already has a
            // wallet, so the flow is always "add another" — and the accounts
            // query hasn't resolved yet on a fresh tab to say so itself.
            onOpen({ walletType: autoMount, skipSecurityCheck: true, analyticsFrom: 'main' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync selectedMethod with the latest open params, and bounce
    // pro-gated entries to Buy Pro when the user has no subscription.
    useEffect(() => {
        if (!isOpen) return;
        const wallet = params?.walletType;
        if (wallet && requiresPro(wallet) && !hasValidPro) {
            onClose();
            openBuyPro();
            return;
        }
        if (wallet) {
            sdk.addWalletPage?.open(wallet);
        }
        setSelectedMethod(wallet);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, params?.walletType]);

    const handleClose = useCallback(() => {
        sdk.addWalletPage?.close();
        onClose();
    }, [onClose, sdk]);

    const handlePickMethod = useCallback(
        async (method: AddWalletMethod) => {
            if (requiresPro(method) && !hasValidPro) {
                onClose();
                openBuyPro();
                return;
            }
            // Cancelling the security check keeps the picker open.
            try {
                if (!methodRunsOwnSecurityCheck(method, sdk)) {
                    await securityCheck();
                }
            } catch (e) {
                console.error(e);
                return;
            }
            sdk.addWalletPage?.open(method);
            setSelectedMethod(method);
        },
        [hasValidPro, openBuyPro, onClose, sdk, securityCheck]
    );

    const pickerMode = params?.pickerMode ?? 'all';
    const isPicker = !selectedMethod;

    useEffect(() => {
        if (isOpen && isPicker) preloadImportExistingWallet();
    }, [isOpen, isPicker]);

    // Sub-screens call AddWalletContext.navigateHome to return to
    // the picker. When the modal was opened with a preselected
    // walletType there's no picker to go back to — leave it undefined
    // so the back-to-picker affordance is hidden.
    const navigateHome = useMemo(
        () => (params?.walletType ? undefined : () => setSelectedMethod(undefined)),
        [params?.walletType]
    );

    const contextValue = useMemo(
        () => ({ navigateHome, analyticsFrom: params?.analyticsFrom ?? 'main' }),
        [navigateHome, params?.analyticsFrom]
    );

    return (
        <AddWalletContext.Provider value={contextValue}>
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                mobileHeight="full"
                disableHeightAnimation
                variant={isPicker ? 'alert' : 'content'}
                tag={`add-wallet-${selectedMethod}`}
                afterClose={() => setSelectedMethod(undefined)}
                heading={isPicker ? t(headingKey(pickerMode)) : undefined}
                subheading={isPicker ? t(subheadingKey(pickerMode)) : undefined}
            >
                {isPicker ? (
                    <AddWalletPicker mode={pickerMode} onSelect={handlePickMethod} />
                ) : (
                    <Suspense fallback={<MethodLoadingFallback />}>
                        {renderMethod[selectedMethod](handleClose)}
                    </Suspense>
                )}
            </Modal>
        </AddWalletContext.Provider>
    );
};

// ─── Locals ───────────────────────────────────────────────────────

const headingKey = (mode: AddWalletPickerMode) =>
    mode === 'import' ? 'import_existing_wallet' : 'import_add_wallet';

const subheadingKey = (mode: AddWalletPickerMode) =>
    mode === 'import' ? 'import_wallet_picker_subtitle' : 'import_add_wallet_description';

const MethodLoadingFallback = () => (
    <div className="flex min-h-[280px] items-center justify-center">
        <Loader size="medium" />
    </div>
);
