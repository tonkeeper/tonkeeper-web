import { mnemonicNew } from '@ton/crypto';
import { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { AccountMultichain, AccountTonMnemonic } from '@tonkeeper/core/dist/entries/account';
import { DEFAULT_MULTICHAIN_CHAINS } from '@tonkeeper/core/dist/multichain';
import { generateBip39Mnemonic } from '@tonkeeper/core/dist/service/mnemonicService';
import { suggestWalletName } from '@tonkeeper/core/dist/service/defaultWalletName';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { DEFAULT_WALLET_EMOJI } from '@tonkeeper/core/dist/utils/emojis';
import { WALLET_COLORS } from '@tonkeeper/core/dist/entries/walletColor';

import { AddWalletContext } from '../../components/create/AddWalletContext';
import { BackupCheck } from '../../components/create/BackupCheck';
import { BackupIntro } from '../../components/create/BackupIntro';
import { BackupShow } from '../../components/create/BackupShow';
import { CustomizeWallet, CustomizeWalletForm } from '../../components/create/CustomizeWallet';
import { PasswordStep } from '../../components/create/PasswordStep';
import { SelectWalletNetworks } from '../../components/create/SelectWalletNetworks';
import { useConfirmDiscardNotification } from '../../components/modals/ConfirmDiscardNotificationControlled';
import {
    OnCloseInterceptor,
    useSetModalOnBack,
    useSetModalOnCloseInterceptor
} from '../../primitives/Modal';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import {
    useAccountsState,
    useCreateAccountMnemonic,
    useCreateAccountMultichain,
    useMutateRenameAccount
} from '../../state/wallet';
import { useMutateWalletColor, useWalletColorResolver } from '../../state/walletColor';

import {
    BACKUP_MISMATCH_ERROR_TYPE,
    toWalletFlowError,
    useAddWalletFlowAnalytics,
    WalletFlowMode
} from '../../hooks/analytics/wallet-flow';

import { FinalView } from './Password';
import { Subscribe } from './Subscribe';

type Account = AccountTonMnemonic | AccountMultichain;

type Step =
    | 'password'
    | 'intro'
    | 'showPhrase'
    | 'checkPhrase'
    | 'customize'
    | 'selectNetworks'
    | 'subscribe'
    | 'done';

/**
 * Onboarding "Create new wallet". Linear wizard.
 *
 * `multichainEnabled` only decides which mnemonic shape gets generated
 * and which create-account hook runs at the verification step; the UI
 * screens are identical either way. See CLAUDE.md → "Scope of the flag"
 * for the contract.
 *
 *   password? → intro → showPhrase → checkPhrase
 *     → customize → (legacy only) selectNetworks
 *     → (sdk.notifications) subscribe → done
 *
 * The password step opens the wizard on platforms that need a wallet
 * password (web, extension). Platforms with `sdk.keychain` (desktop,
 * mobile) store secrets through the OS keychain and skip straight to
 * `intro`.
 */
export const CreateStandardWallet: FC<{ afterCompleted: () => void }> = ({ afterCompleted }) => {
    const sdk = useAppSdk();
    const { defaultWalletVersion, multichainEnabled } = useAppContext();

    const [step, setStep] = useState<Step>(sdk.keychain ? 'intro' : 'password');
    const [password, setPassword] = useState<string>();
    const [mnemonic, setMnemonic] = useState<string[]>();
    const [account, setAccount] = useState<Account>();

    // Monotonic: flips true the first time the user clicks past
    // `intro` and stays true. Drives the discard-confirm gate — once
    // secret material has been on screen, every exit needs a confirm
    // until the account is persisted.
    const [wordsExposed, setWordsExposed] = useState(false);

    // Kick off mnemonic generation as soon as the wizard mounts. The
    // password step (or `intro` on keychain platforms) takes longer
    // than generation, so by the time the user reaches `showPhrase`
    // the mnemonic is ready. Multichain uses a 12-word BIP39 phrase
    // (128-bit entropy, cross-wallet default); legacy TON stays on the
    // 24-word `mnemonicNew`.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const m = multichainEnabled ? generateBip39Mnemonic(12) : await mnemonicNew(24);
            if (!cancelled) setMnemonic(m);
        })();
        return () => {
            cancelled = true;
        };
    }, [multichainEnabled]);

    const create = useAccountCreation({ multichainEnabled, defaultWalletVersion });
    const { mutateAsync: renameAccount, isLoading: isRenaming } = useMutateRenameAccount();

    const analytics = useAddWalletFlowAnalytics();
    const walletMode = multichainEnabled ? 'multi' : 'single';
    useCreateFlowAnalytics({ step, walletMode, analytics });

    // Default name + emoji shown when the user first lands on the
    // customize step. The account hasn't been persisted yet at that
    // point (see `onRenameSubmit` below) so we can't use the service-
    // generated defaults — derive them locally with the same
    // `suggestWalletName` rules the service applies.
    const existingAccounts = useAccountsState();
    const defaults = useMemo(
        () => ({
            name: suggestWalletName(
                'Wallet',
                existingAccounts.map(a => a.name)
            ),
            emoji: DEFAULT_WALLET_EMOJI,
            colorId: WALLET_COLORS[existingAccounts.length % WALLET_COLORS.length].id
        }),
        [existingAccounts]
    );
    const resolveWalletColor = useWalletColorResolver();
    const { setWalletColor } = useMutateWalletColor();

    const onRenameSubmit = useCallback(
        async ({ name, emoji, colorId }: CustomizeWalletForm) => {
            if (!mnemonic) return;
            // First customize submit: create-and-persist the account,
            // then rename it. Subsequent visits (back from a later step)
            // skip the create and only re-run rename.
            let active = account;
            const isFirstSubmit = !active;
            if (!active) {
                active = await create.run({ mnemonic, password });
            }
            await setWalletColor(active.id, colorId);
            const renamed = (await renameAccount({ id: active.id, name, emoji })) as Account;
            setAccount(renamed);
            // The create flow has no skip affordance — every wallet that
            // reaches this point went through the recovery-phrase check.
            if (isFirstSubmit) {
                analytics.createSuccess(walletMode, true);
            }
            setStep(
                stepAfterCustomize({ multichainEnabled, hasNotifications: !!sdk.notifications })
            );
        },
        [
            mnemonic,
            password,
            account,
            create,
            renameAccount,
            setWalletColor,
            multichainEnabled,
            sdk.notifications,
            analytics,
            walletMode
        ]
    );

    useFlowNavGuard({ step, wordsExposed, accountReady: !!account, setStep });

    // ── render ──────────────────────────────────────────────────────

    if (step === 'password') {
        return (
            <PasswordStep
                onSubmit={pw => {
                    setPassword(pw);
                    setStep('intro');
                }}
            />
        );
    }

    if (step === 'intro') {
        return (
            <BackupIntro
                onContinue={() => {
                    setWordsExposed(true);
                    setStep('showPhrase');
                }}
            />
        );
    }

    // All steps past `intro` need the mnemonic. Generation kicks off
    // on mount and finishes long before the user clicks through the
    // password + intro steps, so this guard never hits in practice.
    if (!mnemonic) return null;

    if (step === 'showPhrase') {
        return <BackupShow mnemonic={mnemonic} onCheck={() => setStep('checkPhrase')} />;
    }

    if (step === 'checkPhrase') {
        return (
            <BackupCheck
                mnemonic={mnemonic}
                onConfirm={() => {
                    analytics.backupSuccess(walletMode, 'onboarding');
                    setStep('customize');
                }}
                onFailedAttempt={() =>
                    analytics.backupError(
                        walletMode,
                        'onboarding',
                        toWalletFlowError(
                            'Recovery phrase confirmation mismatch',
                            BACKUP_MISMATCH_ERROR_TYPE
                        )
                    )
                }
            />
        );
    }

    if (step === 'customize') {
        // The account doesn't exist yet on the first visit — deferring
        // its creation to this step's submit handler keeps the portfolio
        // from mounting underneath the modal while the user is still
        // picking a name. Defaults from `defaults` seed the form.
        return (
            <CustomizeWallet
                name={account?.name ?? defaults.name}
                walletEmoji={account?.emoji ?? defaults.emoji}
                walletColorId={account ? resolveWalletColor(account.id).id : defaults.colorId}
                submitHandler={onRenameSubmit}
                isLoading={isRenaming || create.isLoading}
            />
        );
    }

    // All steps below run after `customize` submits, so `account` is
    // always defined here. The guard keeps TypeScript happy.
    if (!account) return null;

    // Multichain accounts always include the full DEFAULT_MULTICHAIN_CHAINS
    // set, so the per-account TRON opt-in screen would be a no-op. The
    // step machine only routes here for legacy TON accounts.
    if (step === 'selectNetworks') {
        return (
            <SelectWalletNetworks
                onContinue={() => setStep(sdk.notifications ? 'subscribe' : 'done')}
            />
        );
    }

    if (step === 'subscribe') {
        return (
            <Subscribe
                mnemonicType={multichainEnabled ? 'bip39' : 'ton'}
                wallet={account.activeTonWallet}
                mnemonic={mnemonic}
                onDone={() => setStep('done')}
            />
        );
    }

    return <FinalView afterCompleted={afterCompleted} />;
};

// ── helpers ─────────────────────────────────────────────────────────

/**
 * Flow-entry and backup-screen funnel events. Both are once-per-flow: the
 * wizard can walk back into `intro`, but a re-visit isn't a new flow entry.
 */
const useCreateFlowAnalytics = ({
    step,
    walletMode,
    analytics
}: {
    step: Step;
    walletMode: WalletFlowMode;
    analytics: ReturnType<typeof useAddWalletFlowAnalytics>;
}) => {
    const started = useRef(false);
    const backupStarted = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;
        analytics.createStarted(walletMode);
    }, [analytics, walletMode]);

    useEffect(() => {
        if (step !== 'intro' || backupStarted.current) return;
        backupStarted.current = true;
        analytics.backupStarted(walletMode, 'onboarding');
    }, [step, analytics, walletMode]);
};

const stepAfterCustomize = ({
    multichainEnabled,
    hasNotifications
}: {
    multichainEnabled: boolean;
    hasNotifications: boolean;
}): Step => {
    if (!multichainEnabled) return 'selectNetworks';
    if (hasNotifications) return 'subscribe';
    return 'done';
};

/**
 * Wraps the two mutation hooks behind a single `run({ mnemonic, password })`
 * that branches on `multichainEnabled` — multichain creates an
 * `AccountMultichain` with the default chain set; legacy TON creates
 * an `AccountTonMnemonic` at `defaultWalletVersion`. `password` is
 * forwarded to the mutation; the mutation ignores it on platforms with
 * `sdk.keychain` (secret stored in the OS keychain instead).
 */
const useAccountCreation = ({
    multichainEnabled,
    defaultWalletVersion
}: {
    multichainEnabled: boolean;
    defaultWalletVersion: WalletVersion;
}) => {
    const { mutateAsync: createTon, isLoading: isCreatingTon } = useCreateAccountMnemonic();
    const { mutateAsync: createMultichain, isLoading: isCreatingMultichain } =
        useCreateAccountMultichain();

    const run = useCallback(
        ({ mnemonic, password }: { mnemonic: string[]; password?: string }): Promise<Account> =>
            multichainEnabled
                ? createMultichain({
                      mnemonic,
                      password,
                      enabledChains: DEFAULT_MULTICHAIN_CHAINS,
                      selectAccount: true
                  })
                : createTon({
                      mnemonic,
                      password,
                      versions: [defaultWalletVersion],
                      selectAccount: true,
                      mnemonicType: 'ton'
                  }),
        [multichainEnabled, createMultichain, createTon, defaultWalletVersion]
    );

    return { run, isLoading: isCreatingTon || isCreatingMultichain };
};

/**
 * Wires the modal's back arrow and close (X) handlers to the current
 * wizard step.
 *
 *   - Back is step-keyed: back from `showPhrase` returns to `intro`,
 *     back from `checkPhrase` returns to `showPhrase`, back from
 *     `selectNetworks` returns to `customize`. Back on `password` or
 *     `intro` exits to the picker; if the user has been past `intro`
 *     before (`wordsExposed`) the exit goes through the discard-confirm
 *     modal first.
 *   - Close (X / ESC / backdrop) is intercepted only while secret
 *     material is on screen but no account has been persisted —
 *     i.e. `wordsExposed && !accountReady`. Past that, close is free.
 */
const useFlowNavGuard = ({
    step,
    wordsExposed,
    accountReady,
    setStep
}: {
    step: Step;
    wordsExposed: boolean;
    accountReady: boolean;
    setStep: (s: Step) => void;
}) => {
    const { onOpen: openConfirmDiscard } = useConfirmDiscardNotification();
    const { navigateHome } = useContext(AddWalletContext);

    const onBack = useMemo<(() => void) | undefined>(() => {
        switch (step) {
            case 'password':
                return navigateHome;
            case 'intro':
                if (!wordsExposed) return navigateHome;
                return () =>
                    openConfirmDiscard({
                        onClose: discard => {
                            if (discard) navigateHome?.();
                        }
                    });
            case 'showPhrase':
                return () => setStep('intro');
            case 'checkPhrase':
                return accountReady ? undefined : () => setStep('showPhrase');
            case 'selectNetworks':
                return () => setStep('customize');
            default:
                return undefined;
        }
    }, [step, wordsExposed, accountReady, navigateHome, openConfirmDiscard, setStep]);
    useSetModalOnBack(onBack);

    const onCloseInterceptor = useMemo<OnCloseInterceptor>(() => {
        if (!wordsExposed || accountReady) return undefined;
        return (closeModal, cancelClose) =>
            openConfirmDiscard({
                onClose: discard => (discard ? closeModal() : cancelClose())
            });
    }, [wordsExposed, accountReady, openConfirmDiscard]);
    useSetModalOnCloseInterceptor(onCloseInterceptor);
};
