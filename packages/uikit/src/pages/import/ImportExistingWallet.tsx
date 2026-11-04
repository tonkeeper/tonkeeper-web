import React, { FC, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CustomizeWallet, CustomizeWalletForm } from '../../components/create/CustomizeWallet';
import { MnemonicInputForm } from '../../components/create/MnemonicInputForm';
import { PasswordStep } from '../../components/create/PasswordStep';
import { ImportMnemonicType, SelectMnemonicType } from '../../components/create/SelectMnemonicType';
import { ChooseWalletKind, WalletKind } from '../../components/create/ChooseWalletKind';
import {
    ImportWalletKindPreviews,
    loadImportWalletKindPreviews
} from '@tonkeeper/core/dist/service/importWalletKindPreviewService';
import { useAppSdk } from '../../hooks/appSdk';
import { FinalView } from './Password';
import { Subscribe } from './Subscribe';
import {
    useAccountsState,
    useCreateAccountMAM,
    useCreateAccountMultichain,
    useMutateRenameAccount,
    useCreateAccountMnemonic,
    useMutateRenameAccountDerivations
} from '../../state/wallet';
import { useMutateWalletColor, useWalletColorResolver } from '../../state/walletColor';
import { ChoseWalletVersionsByMnemonic } from '../../components/create/ChoseWalletVersions';
import { ChooseMultichainTonVersionByMnemonic } from '../../components/create/ChooseMultichainTonVersion';
import { resolveMultichainTonImportVersion } from '@tonkeeper/core/dist/service/multichainCreateService';
import {
    AccountMAM,
    AccountMultichain,
    AccountTonMnemonic,
    getAccountByWalletById
} from '@tonkeeper/core/dist/entries/account';
import {
    createStandardTonAccountByMnemonic,
    getContextApiByNetwork,
    getMAMAccountWalletsInfo,
    getStandardTonWalletVersions
} from '@tonkeeper/core/dist/service/walletService';
import { useAppContext } from '../../hooks/appContext';
import { WalletId, WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { AccountIsAlreadyAdded } from '../../components/create/AccountIsAlreadyAdded';
import { useConfirmDiscardNotification } from '../../components/modals/ConfirmDiscardNotificationControlled';
import { AddWalletContext } from '../../components/create/AddWalletContext';
import {
    OnCloseInterceptor,
    useSetModalOnBack,
    useSetModalOnCloseInterceptor
} from '../../primitives/Modal';
import { TonKeychainRoot } from '@ton-keychain/core';
import { useMutation } from '@tanstack/react-query';
import { useUserFiat } from '../../state/fiat';
import { mnemonicValidate } from '@ton/crypto';
import {
    mnemonicToKeypair,
    validateBip39Mnemonic
} from '@tonkeeper/core/dist/service/mnemonicService';
import { MnemonicType } from '@tonkeeper/core/dist/entries/password';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { useIsTronEnabledGlobally, useTronApi } from '../../state/tron/tron';
import { SelectWalletNetworks } from '../../components/create/SelectWalletNetworks';
import { useTranslation } from '../../hooks/translation';
import { useAutoAuthMutation } from '../../state/pro';
import { tonProofSignerByTonMnemonic } from '../../hooks/accountUtils';
import { maxOneCall } from '@tonkeeper/core/dist/utils/common';
import { DEFAULT_MULTICHAIN_CHAINS } from '@tonkeeper/core/dist/multichain';
import {
    toWalletFlowError,
    useAddWalletFlowAnalytics,
    WalletFlowMode
} from '../../hooks/analytics/wallet-flow';

const useProcessMnemonic = () => {
    const context = useAppContext();
    const fiat = useUserFiat();
    const sdk = useAppSdk();
    const accounts = useAccountsState();
    const isTronEnabled = useIsTronEnabledGlobally();
    const tronApi = useTronApi();

    return useMutation<
        {
            tonKeychain:
                | { type: 'create' }
                | { type: 'exisiting'; account: Account; walletId: WalletId }
                | undefined;
            tonMnemonic:
                | {
                      type: 'select-versions';
                  }
                | { type: 'exisiting'; account: Account; walletId: WalletId }
                | undefined;
            bip39:
                | { type: 'select-versions' }
                | { type: 'exisiting'; account: Account; walletId: WalletId }
                | undefined;
            /**
             * TON version the phrase is imported as when it becomes a
             * multichain account: the only funded version, or the user's
             * pick when both W5 and v4R2 hold funds. Absent when the phrase
             * already backs an account or isn't valid BIP39.
             */
            multichainTonVersion?: WalletVersion | 'choose';
            /**
             * Holdings behind each reading of a phrase that can be imported
             * either as a TON or as a multichain wallet. Absent when only
             * one reading applies or multichain import is off.
             */
            previews?: ImportWalletKindPreviews;
        },
        Error,
        string[]
    >(async mnemonic => {
        let tonKeychain = undefined;
        let tonMnemonic = undefined;
        let bip39 = undefined;
        let multichainTonVersion: WalletVersion | 'choose' | undefined = undefined;

        const mightBeMAM = await TonKeychainRoot.isValidMnemonicLegacy(mnemonic);
        if (mightBeMAM) {
            const possibleMAMAccount = await TonKeychainRoot.fromMnemonic(mnemonic, {
                allowLegacyMnemonic: true
            });

            const existingAcc = accounts.find(a => a.id === possibleMAMAccount.id);
            if (existingAcc) {
                tonKeychain = {
                    type: 'exisiting',
                    account: existingAcc,
                    walletId: existingAcc.activeTonWallet.id
                } as const;
            } else {
                const wallets = await getMAMAccountWalletsInfo({
                    account: possibleMAMAccount,
                    network: Network.MAINNET,
                    appContext: context,
                    fiat,
                    walletVersion: context.defaultWalletVersion
                });

                const shouldCreateMam = wallets.some(v => v.tonBalance > 0 || v.hasJettons);
                if (shouldCreateMam) {
                    tonKeychain = {
                        type: 'create'
                    } as const;
                }
            }
        }

        const isValidForStandardWallet = await mnemonicValidate(mnemonic);
        if (isValidForStandardWallet) {
            const possibleStadnardAccount = await createStandardTonAccountByMnemonic(
                context,
                sdk.storage,
                mnemonic,
                'ton',
                {
                    auth: {
                        kind: 'keychain'
                    },
                    versions: [
                        WalletVersion.V5R1,
                        WalletVersion.V5_BETA,
                        WalletVersion.V4R2,
                        WalletVersion.V3R2,
                        WalletVersion.V3R1
                    ],
                    generateTronWallet: isTronEnabled
                }
            );

            for (const w of possibleStadnardAccount.allTonWallets) {
                const existingAcc = getAccountByWalletById(accounts, w.id);
                if (existingAcc) {
                    tonMnemonic = {
                        type: 'exisiting',
                        account: existingAcc,
                        walletId: w.id
                    } as const;
                    break;
                }
            }

            if (tonMnemonic === undefined) {
                const keyPair = await mnemonicToKeypair(mnemonic, 'ton');
                const publicKey = keyPair.publicKey.toString('hex');
                const versions = await getStandardTonWalletVersions({
                    publicKey,
                    network: Network.MAINNET,
                    appContext: context,
                    fiat
                });
                if (versions.some(v => v.tonBalance || v.hasJettons)) {
                    tonMnemonic = { type: 'select-versions' } as const;
                }
            }
        }

        const isValidBip39 = await validateBip39Mnemonic(mnemonic);
        if (isValidBip39) {
            const possibleStadnardAccount = await createStandardTonAccountByMnemonic(
                context,
                sdk.storage,
                mnemonic,
                'bip39',
                {
                    auth: {
                        kind: 'keychain'
                    },
                    versions: [
                        WalletVersion.V5R1,
                        WalletVersion.V5_BETA,
                        WalletVersion.V4R2,
                        WalletVersion.V3R2,
                        WalletVersion.V3R1
                    ],
                    generateTronWallet: isTronEnabled
                }
            );

            for (const w of possibleStadnardAccount.allTonWallets) {
                const existingAcc = getAccountByWalletById(accounts, w.id);
                if (existingAcc) {
                    bip39 = { type: 'exisiting', account: existingAcc, walletId: w.id } as const;
                    break;
                }
            }

            if (bip39 === undefined) {
                const keyPair = await mnemonicToKeypair(mnemonic, 'bip39');
                const publicKey = keyPair.publicKey.toString('hex');
                const versions = await getStandardTonWalletVersions({
                    publicKey,
                    network: Network.MAINNET,
                    appContext: context,
                    fiat
                });
                if (versions.some(v => v.tonBalance || v.hasJettons)) {
                    bip39 = { type: 'select-versions' } as const;
                }
                multichainTonVersion = resolveMultichainTonImportVersion(versions);
            }
        }

        let previews = undefined;
        if (context.multichainEnabled) {
            previews = await loadImportWalletKindPreviews({
                mnemonic,
                isValidTonMnemonic: isValidForStandardWallet,
                isValidBip39,
                api: getContextApiByNetwork(context, Network.MAINNET),
                fiat,
                tronApi: isTronEnabled ? tronApi : undefined
            });
        }

        return { tonKeychain, tonMnemonic, bip39, multichainTonVersion, previews };
    });
};

/** Chooser order — MAM first, then TON-only, then multichain. */
const MNEMONIC_TYPE_ORDER: ImportMnemonicType[] = ['tonKeychain', 'tonMnemonic', 'bip39'];

/**
 * `wallet_mode` for a phrase whose mnemonic type hasn't been resolved yet — a
 * BIP39-only phrase becomes a multichain account, everything else (including a
 * phrase that fails validation outright) lands on a TON account.
 */
const guessImportWalletMode = async (
    mnemonic: string[],
    multichainEnabled: boolean
): Promise<WalletFlowMode> => {
    if (!multichainEnabled) return 'single';
    if (await mnemonicValidate(mnemonic)) return 'single';
    return (await validateBip39Mnemonic(mnemonic)) ? 'multi' : 'single';
};

const isValidForBothMnemonicTypes = async (mnemonic: string[]) =>
    (await mnemonicValidate(mnemonic)) && (await validateBip39Mnemonic(mnemonic));

const getMnemonicTypeFallback = async (mnemonic: string[]) => {
    if (await mnemonicValidate(mnemonic)) {
        return 'tonMnemonic';
    }

    if (mnemonic.length === 12) {
        if (await validateBip39Mnemonic(mnemonic)) {
            return 'bip39';
        }

        throw new Error('Wallet mnemonic not valid');
    }

    if (await TonKeychainRoot.isValidMnemonic(mnemonic)) {
        return 'tonKeychain';
    }

    if (await validateBip39Mnemonic(mnemonic)) {
        return 'bip39';
    }

    throw new Error('Wallet mnemonic not valid');
};

export const ImportExistingWallet: FC<{ afterCompleted: () => void }> = ({ afterCompleted }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { multichainEnabled } = useAppContext();
    const fiat = useUserFiat();

    const [mnemonic, setMnemonic] = useState<string[] | undefined>();
    // `AccountMultichain` joins the union once `multichainEnabled` is on —
    // a BIP39 phrase is then routed to the multichain create path instead of
    // the TON-only one.
    const [createdAccount, setCreatedAccount] = useState<
        AccountTonMnemonic | AccountMAM | AccountMultichain | undefined
    >(undefined);
    const [existingAccountAndWallet, setExistingAccountAndWallet] = useState<
        | {
              account: Account;
              walletId: WalletId;
          }
        | undefined
    >();

    const [editNamePagePassed, setEditNamePagePassed] = useState(false);
    const [selectNetworksPassed, setSelectNetworksPassed] = useState(false);
    const [notificationsSubscribePagePassed, setNotificationsSubscribePagePassed] = useState(false);
    const { mutateAsync: renameAccount, isLoading: renameAccountLoading } =
        useMutateRenameAccount<AccountTonMnemonic>();
    const { mutateAsync: renameDerivations, isLoading: renameDerivationsLoading } =
        useMutateRenameAccountDerivations();

    const { mutateAsync: tryAutoAuth } = useAutoAuthMutation();
    const { mutateAsync: createWalletsAsync, isLoading: isCreatingWallets } =
        useCreateAccountMnemonic();
    const { mutateAsync: createAccountMam, isLoading: isCreatingMam } = useCreateAccountMAM();
    const { mutateAsync: createAccountMultichain, isLoading: isCreatingMultichain } =
        useCreateAccountMultichain();

    const {
        mutateAsync: processMnemonic,
        isLoading: isProcessMnemonic,
        data: processedMnemonicResult,
        reset: resetProcessMnemonic
    } = useProcessMnemonic();

    const [selectedMnemonicType, setSelectedMnemonicType] = useState<ImportMnemonicType>();
    const [mnemonicTypeOptions, setMnemonicTypeOptions] = useState<ImportMnemonicType[]>([]);
    // Both W5 and v4R2 hold funds, so the multichain import waits on the
    // user's version pick instead of creating the account right away.
    const [chooseMultichainTonVersion, setChooseMultichainTonVersion] = useState(false);
    // Account creation parked until the user supplies the app password.
    // Only set on platforms without `sdk.keychain`; while set, the flow
    // renders `PasswordStep` instead of whichever screen queued it, and
    // that screen's own state stays untouched so cancelling the step
    // returns there.
    const [pendingCreate, setPendingCreate] = useState<{
        mnemonic: string[];
        run: (password: string) => Promise<void>;
    }>();
    const isCreating = isCreatingWallets || isCreatingMam || isCreatingMultichain;
    const [walletKindPreviews, setWalletKindPreviews] = useState<ImportWalletKindPreviews>();

    const analytics = useAddWalletFlowAnalytics();

    // The mnemonic type — and with it the wallet mode — is only known once the
    // phrase has been read, so this import can't use `useImportFlowAnalytics`.
    const trackImportStarted = async (m: string[]) =>
        analytics.importStarted(await guessImportWalletMode(m, multichainEnabled), 'mnemonic');

    const trackImportError = async (m: string[], error: unknown) =>
        analytics.importError(
            await guessImportWalletMode(m, multichainEnabled),
            'mnemonic',
            toWalletFlowError(error)
        );

    // Keychain platforms store the secret in the OS keychain and never
    // need a password, so `create` runs right away. Elsewhere the mutation
    // would otherwise ask for the password through the global
    // UnlockNotification — a modal stacked over this one — so it is
    // deferred to the inline password step instead.
    const createWithPassword = async (
        m: string[],
        create: (password?: string) => Promise<void>
    ) => {
        if (sdk.keychain) {
            await create();
            return;
        }
        setPendingCreate({ mnemonic: m, run: create });
    };

    const onPasswordSubmit = async (password: string) => {
        if (!pendingCreate) return;
        try {
            await pendingCreate.run(password);
        } catch (e) {
            void trackImportError(pendingCreate.mnemonic, e);
            // Same recovery as the back arrow: a failed creation queued from
            // the phrase input must hand the input back in a usable state.
            if (!mnemonic) resetProcessMnemonic();
        } finally {
            setPendingCreate(undefined);
        }
    };

    // Covers all three creation paths (MAM, multichain, version-picker) from
    // one place, and reads the mode off the account that actually got created.
    const successReported = useRef(false);
    useEffect(() => {
        if (!createdAccount || successReported.current) return;
        successReported.current = true;
        analytics.importSuccess(
            createdAccount.type === 'multichain' ? 'multi' : 'single',
            'mnemonic'
        );
    }, [createdAccount, analytics]);

    const onMnemonic = async (m: string[]) => {
        // Not awaited: resolving the wallet mode re-validates the phrase, and
        // the funnel must not sit in front of the user's import.
        void trackImportStarted(m);
        try {
            await processAndCreate(m);
        } catch (e) {
            void trackImportError(m, e);
            throw e;
        }
    };

    const processAndCreate = async (m: string[]) => {
        const result = await processMnemonic(m);

        // Types `processMnemonic` resolved to an existing account or to a
        // wallet holding funds.
        const detected = MNEMONIC_TYPE_ORDER.filter(type => result[type] !== undefined);

        // A phrase that can become either a TON or a multichain wallet (see
        // `loadImportWalletKindPreviews`) goes to whichever side shows
        // activity, and to multichain when neither does. Only when both
        // sides hold something does the user pick, with what each side
        // holds shown next to it. MAM phrases keep the legacy chooser.
        if (result.previews && !detected.includes('tonKeychain')) {
            const { ton, multichain } = result.previews;
            if (ton.hasActivity && multichain.hasActivity) {
                setWalletKindPreviews(result.previews);
                setMnemonic(m);
                return;
            }
            await onSelectWalletKindPure(ton.hasActivity ? 'ton' : 'multichain', m, result);
            return;
        }

        const ambiguous = await isValidForBothMnemonicTypes(m);
        const options = ambiguous
            ? MNEMONIC_TYPE_ORDER.filter(type => type !== 'tonKeychain' || detected.includes(type))
            : detected;
        setMnemonicTypeOptions(options);

        if (options.length === 0) {
            const typeToSet = await getMnemonicTypeFallback(m);
            // `mnemonic` and the type are committed only once the account
            // exists, so a deferred creation that gets cancelled lands the
            // user back on the phrase input rather than on a picker with
            // nothing to pick.
            const commit = () => {
                setSelectedMnemonicType(typeToSet);
                setMnemonic(m);
            };
            if (typeToSet === 'tonKeychain') {
                await createWithPassword(m, async password => {
                    const newAccountMam = await createAccountMam({
                        mnemonic: m,
                        password,
                        selectAccount: true
                    });
                    setCreatedAccount(newAccountMam.account);
                    commit();
                });
            } else if (typeToSet === 'bip39' && multichainEnabled) {
                await createWithPassword(m, async password => {
                    const newAccount = await createAccountMultichain({
                        mnemonic: m,
                        password,
                        enabledChains: DEFAULT_MULTICHAIN_CHAINS,
                        selectAccount: true
                    });
                    setCreatedAccount(newAccount);
                    commit();
                });
            } else {
                commit();
            }
            return;
        }

        if (options.length === 1) {
            await onSelectMnemonicTypePure(options[0], m, result);
            return;
        }

        setMnemonic(m);
    };

    /**
     * Resolves a picked (or auto-picked) mnemonic type into the next step.
     * `legacyTon` imports a BIP39 phrase as the legacy TON-only account —
     * the "TON wallet" side of the kind chooser — instead of as multichain.
     */
    const onSelectMnemonicTypePure = async (
        mnemonicType: ImportMnemonicType,
        m: string[],
        precessingRes: typeof processedMnemonicResult,
        { legacyTon = false }: { legacyTon?: boolean } = {}
    ) => {
        // `mnemonic` and the type are committed together, and for a deferred
        // creation only once the account exists, so cancelling the password
        // step lands the user back on the screen the pick was made from
        // rather than on a picker with nothing to pick.
        const commit = () => {
            setSelectedMnemonicType(mnemonicType);
            setMnemonic(m);
        };

        // Undefined for a type offered by the kind chooser rather than by
        // `processMnemonic` — that side holds no TON funds and no account,
        // so there's nothing to reuse and the flow continues into creation.
        const acc = precessingRes?.[mnemonicType];

        if (acc?.type === 'exisiting') {
            setExistingAccountAndWallet(acc);
            commit();
            return;
        }

        if (acc?.type === 'create') {
            await createWithPassword(m, async password => {
                const newAccountMam = await createAccountMam({
                    mnemonic: m,
                    password,
                    selectAccount: true
                });
                setCreatedAccount(newAccountMam.account);
                commit();
            });
            return;
        }

        if (mnemonicType === 'bip39' && multichainEnabled && !legacyTon) {
            // Multichain mode owns the BIP39 branch. The account holds one
            // TON wallet, so the version is resolved from what each version
            // holds; only a phrase funded on both W5 and v4R2 asks the user.
            const tonVersion = precessingRes?.multichainTonVersion;
            if (tonVersion === 'choose') {
                setChooseMultichainTonVersion(true);
                commit();
                return;
            }
            await createWithPassword(m, async password => {
                const newAccount = await createAccountMultichain({
                    mnemonic: m,
                    password,
                    enabledChains: DEFAULT_MULTICHAIN_CHAINS,
                    selectAccount: true,
                    tonVersion
                });
                setCreatedAccount(newAccount);
                commit();
            });
            return;
        }

        commit();
    };

    const onSelectWalletKindPure = (
        kind: WalletKind,
        m: string[],
        precessingRes: NonNullable<typeof processedMnemonicResult>
    ) => {
        const { tonMnemonicType } = precessingRes.previews!;
        const mnemonicType: ImportMnemonicType =
            kind === 'ton' && tonMnemonicType === 'ton' ? 'tonMnemonic' : 'bip39';
        return onSelectMnemonicTypePure(mnemonicType, m, precessingRes, {
            legacyTon: kind === 'ton'
        });
    };

    const onSelectMnemonicType = async (mnemonicType: ImportMnemonicType) => {
        try {
            await onSelectMnemonicTypePure(mnemonicType, mnemonic!, processedMnemonicResult!);
        } catch (e) {
            void trackImportError(mnemonic!, e);
            throw e;
        }
    };

    const onSelectWalletKind = async (kind: WalletKind) => {
        try {
            await onSelectWalletKindPure(kind, mnemonic!, processedMnemonicResult!);
        } catch (e) {
            void trackImportError(mnemonic!, e);
            throw e;
        }
    };

    const resolveWalletColor = useWalletColorResolver();
    const { setWalletColor } = useMutateWalletColor();
    const onRename = async ({ name, emoji, colorId }: CustomizeWalletForm) => {
        await setWalletColor(createdAccount!.id, colorId);
        let newAcc: AccountTonMnemonic | AccountMAM | AccountMultichain = await renameAccount({
            id: createdAccount!.id,
            name,
            emoji
        });

        if (createdAccount!.type === 'mam') {
            const derivationIndexes = (createdAccount as AccountMAM).allAvailableDerivations.map(
                d => d.index
            );
            newAcc = await renameDerivations({
                id: createdAccount!.id,
                derivationIndexes,
                emoji
            });
        }

        setEditNamePagePassed(true);
        setCreatedAccount(newAcc);
    };

    const [isMnemonicFormDirty, setIsMnemonicFormDirty] = useState(false);

    const { onOpen: openConfirmDiscard } = useConfirmDiscardNotification();
    const { navigateHome } = useContext(AddWalletContext);
    const onBack = useMemo(() => {
        if (pendingCreate) {
            if (isCreating) return undefined;
            return () => {
                setPendingCreate(undefined);
                // A creation queued straight from the phrase input returns
                // there; the input reads `processedMnemonicResult` as "still
                // busy", so it has to be cleared for the form to accept input.
                if (!mnemonic) resetProcessMnemonic();
            };
        }

        if (!mnemonic) {
            if (!isMnemonicFormDirty) {
                return navigateHome;
            }
            return () =>
                openConfirmDiscard({
                    onClose: discard => {
                        if (discard) {
                            navigateHome?.();
                        }
                    }
                });
        }

        if (!selectedMnemonicType) {
            if (isCreatingMam || isCreatingMultichain) {
                return undefined;
            }
            return () => {
                setWalletKindPreviews(undefined);
                setChooseMultichainTonVersion(false);
                setMnemonic(undefined);
                resetProcessMnemonic();
            };
        }

        if (existingAccountAndWallet) {
            return () => {
                setExistingAccountAndWallet(undefined);
                setSelectedMnemonicType(undefined);
                setChooseMultichainTonVersion(false);
                setMnemonic(undefined);
                resetProcessMnemonic();
            };
        }

        // Past rename, only the networks screen offers a back affordance.
        // Multichain accounts skip that screen (`selectNetworksPassed` never
        // flips), so without the type check the arrow would leak onto the
        // subscribe and final screens.
        if (editNamePagePassed && !selectNetworksPassed && createdAccount?.type !== 'multichain') {
            return () => setEditNamePagePassed(false);
        }

        return undefined;
    }, [
        pendingCreate,
        isCreating,
        resetProcessMnemonic,
        mnemonic,
        openConfirmDiscard,
        navigateHome,
        existingAccountAndWallet,
        isMnemonicFormDirty,
        selectedMnemonicType,
        isCreatingMam,
        isCreatingMultichain,
        editNamePagePassed,
        selectNetworksPassed,
        createdAccount
    ]);
    useSetModalOnBack(onBack);

    const onCloseInterceptor = useMemo<OnCloseInterceptor>(() => {
        if (!isMnemonicFormDirty) {
            return undefined;
        }

        if (createdAccount || existingAccountAndWallet) {
            return undefined;
        }

        return (closeModal, cancelClose) => {
            openConfirmDiscard({
                onClose: discard => {
                    if (discard) {
                        closeModal();
                    } else {
                        cancelClose();
                    }
                }
            });
        };
    }, [isMnemonicFormDirty, openConfirmDiscard, createdAccount, existingAccountAndWallet]);
    useSetModalOnCloseInterceptor(onCloseInterceptor);

    useEffect(() => {
        // Multichain accounts skip the SelectWalletNetworks step, so gate
        // the auth fire on the same step OR on the account being multichain.
        const networksReady = selectNetworksPassed || createdAccount?.type === 'multichain';
        if (
            mnemonic &&
            createdAccount &&
            networksReady &&
            (selectedMnemonicType === 'tonMnemonic' || selectedMnemonicType === 'bip39')
        ) {
            void tryAutoAuth({
                wallet: createdAccount.activeTonWallet,
                signer: maxOneCall(
                    tonProofSignerByTonMnemonic(
                        mnemonic,
                        selectedMnemonicType === 'tonMnemonic' ? 'ton' : 'bip39'
                    )
                )
            });
        }
    }, [
        createdAccount,
        mnemonic,
        selectedMnemonicType,
        editNamePagePassed,
        selectNetworksPassed,
        tryAutoAuth
    ]);

    if (pendingCreate) {
        return <PasswordStep onSubmit={onPasswordSubmit} isLoading={isCreating} />;
    }

    if (!mnemonic) {
        return (
            <MnemonicInputForm
                onMnemonic={onMnemonic}
                onInvalidMnemonic={async m => {
                    // The funnel needs an entry event to hang the failure off:
                    // a phrase that never validates never reaches `onMnemonic`.
                    await trackImportStarted(m);
                    await trackImportError(m, new Error(t('import_wallet_wrong_words_err')));
                }}
                isLoading={isProcessMnemonic || processedMnemonicResult !== undefined}
                onIsDirtyChange={setIsMnemonicFormDirty}
            />
        );
    }

    if (!selectedMnemonicType) {
        if (walletKindPreviews) {
            return (
                <ChooseWalletKind
                    ton={walletKindPreviews.ton}
                    multichain={walletKindPreviews.multichain}
                    fiat={fiat}
                    onContinue={onSelectWalletKind}
                    isLoading={isCreatingMultichain}
                />
            );
        }

        return (
            <SelectMnemonicType
                availableTypes={mnemonicTypeOptions}
                onSelect={onSelectMnemonicType}
                isLoading={isCreatingMam || isCreatingMultichain}
            />
        );
    }

    if (existingAccountAndWallet) {
        return (
            <AccountIsAlreadyAdded {...existingAccountAndWallet} onOpenAccount={afterCompleted} />
        );
    }

    if (!createdAccount && chooseMultichainTonVersion) {
        return (
            <ChooseMultichainTonVersionByMnemonic
                network={Network.MAINNET}
                mnemonic={mnemonic}
                onSubmit={tonVersion => {
                    void createWithPassword(mnemonic, async password => {
                        const account = await createAccountMultichain({
                            mnemonic,
                            password,
                            enabledChains: DEFAULT_MULTICHAIN_CHAINS,
                            selectAccount: true,
                            tonVersion
                        });
                        setCreatedAccount(account);
                    }).catch(e => trackImportError(mnemonic, e));
                }}
                isLoading={isCreatingMultichain}
            />
        );
    }

    if (!createdAccount) {
        return (
            <ChoseWalletVersionsByMnemonic
                network={Network.MAINNET}
                mnemonic={mnemonic}
                mnemonicType={selectedMnemonicType === 'tonMnemonic' ? 'ton' : 'bip39'}
                onSubmit={versions => {
                    let mnemonicType: MnemonicType | undefined = undefined;
                    if (selectedMnemonicType === 'tonMnemonic') {
                        mnemonicType = 'ton';
                    } else if (selectedMnemonicType === 'bip39') {
                        mnemonicType = 'bip39';
                    }

                    if (!mnemonicType) {
                        throw new Error(`Unexpected mnemonic type ${selectedMnemonicType}`);
                    }

                    const type = mnemonicType;
                    void createWithPassword(mnemonic, async password => {
                        const account = await createWalletsAsync({
                            mnemonic,
                            password,
                            versions,
                            selectAccount: true,
                            mnemonicType: type
                        });
                        setCreatedAccount(account);
                    }).catch(e => trackImportError(mnemonic, e));
                }}
                isLoading={isCreatingWallets}
            />
        );
    }

    if (!editNamePagePassed) {
        return (
            <CustomizeWallet
                name={createdAccount.name}
                submitHandler={onRename}
                walletEmoji={createdAccount.emoji}
                walletColorId={resolveWalletColor(createdAccount.id).id}
                isLoading={renameAccountLoading || renameDerivationsLoading}
                buttonText={t('continue')}
            />
        );
    }

    // Multichain accounts ship every supported chain on by default — the
    // chain-selection screen is for legacy TON-mnemonic accounts that
    // opt into TRON as a sidechain. Skip it for multichain.
    if (!selectNetworksPassed && createdAccount.type !== 'multichain') {
        return <SelectWalletNetworks onContinue={() => setSelectNetworksPassed(true)} />;
    }

    if (
        sdk.notifications &&
        !notificationsSubscribePagePassed &&
        selectedMnemonicType !== 'tonKeychain'
    ) {
        return (
            <Subscribe
                mnemonicType={selectedMnemonicType === 'tonMnemonic' ? 'ton' : 'bip39'}
                wallet={createdAccount.activeTonWallet}
                mnemonic={mnemonic}
                onDone={() => setNotificationsSubscribePagePassed(true)}
            />
        );
    }

    return <FinalView afterCompleted={afterCompleted} />;
};
