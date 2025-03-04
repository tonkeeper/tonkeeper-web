import React, { FC, useContext, useMemo, useState } from 'react';
import { UpdateWalletName } from '../../components/create/WalletName';
import { ImportMnemonicType, ImportWords, SelectMnemonicType } from '../../components/create/Words';
import { useAppSdk } from '../../hooks/appSdk';
import { FinalView } from './Password';
import { Subscribe } from './Subscribe';
import {
    useAccountsState,
    useCreateAccountMAM,
    useCreateAccountMnemonic,
    useMutateRenameAccount,
    useMutateRenameAccountDerivations
} from '../../state/wallet';
import { ChoseWalletVersionsByMnemonic } from '../../components/create/ChoseWalletVersions';
import {
    AccountMAM,
    AccountTonMnemonic,
    getAccountByWalletById
} from '@tonkeeper/core/dist/entries/account';
import {
    createStandardTonAccountByMnemonic,
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
    useSetNotificationOnBack,
    useSetNotificationOnCloseInterceptor
} from '../../components/Notification';
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
import { useIsTronEnabledGlobally } from '../../state/tron/tron';
import { SelectWalletNetworks } from '../../components/create/SelectWalletNetworks';
import { useTranslation } from '../../hooks/translation';

const useProcessMnemonic = () => {
    const context = useAppContext();
    const fiat = useUserFiat();
    const sdk = useAppSdk();
    const accounts = useAccountsState();
    const isTronEnabled = useIsTronEnabledGlobally();

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
        },
        Error,
        string[]
    >(async mnemonic => {
        let tonKeychain = undefined;
        let tonMnemonic = undefined;
        let bip39 = undefined;

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

        const isValidBip39 = validateBip39Mnemonic(mnemonic);
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
            }
        }

        return { tonKeychain, tonMnemonic, bip39 };
    });
};

const getMnemonicTypeFallback = async (mnemonic: string[]) => {
    if (await mnemonicValidate(mnemonic)) {
        return 'tonMnemonic';
    }

    if (mnemonic.length === 12) {
        if (validateBip39Mnemonic(mnemonic)) {
            return 'bip39';
        }

        throw new Error('Wallet mnemonic not valid');
    }

    if (await TonKeychainRoot.isValidMnemonic(mnemonic)) {
        return 'tonKeychain';
    }

    if (validateBip39Mnemonic(mnemonic)) {
        return 'bip39';
    }

    throw new Error('Wallet mnemonic not valid');
};

export const ImportExistingWallet: FC<{ afterCompleted: () => void }> = ({ afterCompleted }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();

    const [mnemonic, setMnemonic] = useState<string[] | undefined>();
    const [createdAccount, setCreatedAccount] = useState<
        AccountTonMnemonic | AccountMAM | undefined
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

    const { mutateAsync: createWalletsAsync, isLoading: isCreatingWallets } =
        useCreateAccountMnemonic();
    const { mutateAsync: createAccountMam, isLoading: isCreatingMam } = useCreateAccountMAM();

    const {
        mutateAsync: processMnemonic,
        isLoading: isProcessMnemonic,
        data: processedMnemonicResult
    } = useProcessMnemonic();

    const availableMnemonicTypes = Object.entries(processedMnemonicResult || {})
        .filter(([_, v]) => v !== undefined)
        .map(v => v[0] as ImportMnemonicType);

    const [selectedMnemonicType, setSelectedMnemonicType] = useState<ImportMnemonicType>();

    const onMnemonic = async (m: string[]) => {
        const result = await processMnemonic(m);

        const availableOptions = Object.entries(result).filter(([_, v]) => v !== undefined);
        if (availableOptions.length === 0) {
            const typeToSet = await getMnemonicTypeFallback(m);
            if (typeToSet === 'tonKeychain') {
                const newAccountMam = await createAccountMam({
                    mnemonic: m,
                    selectAccount: true
                });
                setCreatedAccount(newAccountMam);
            }
            setSelectedMnemonicType(typeToSet);
        } else if (availableOptions.length === 1) {
            await onSelectMnemonicTypePure(availableOptions[0][0] as ImportMnemonicType, m, result);
        }

        setMnemonic(m);
    };

    const onSelectMnemonicTypePure = async (
        mnemonicType: ImportMnemonicType,
        m: string[],
        precessingRes: typeof processedMnemonicResult
    ) => {
        const acc = precessingRes![mnemonicType]!;

        if (acc.type === 'exisiting') {
            setExistingAccountAndWallet(acc);
        }

        if (acc.type === 'create') {
            const newAccountMam = await createAccountMam({
                mnemonic: m,
                selectAccount: true
            });
            setCreatedAccount(newAccountMam);
        }

        setSelectedMnemonicType(mnemonicType);
    };

    const onSelectMnemonicType = (mnemonicType: ImportMnemonicType) => {
        return onSelectMnemonicTypePure(mnemonicType, mnemonic!, processedMnemonicResult!);
    };

    const onRename = async (form: { name: string; emoji: string }) => {
        let newAcc: AccountTonMnemonic | AccountMAM = await renameAccount({
            id: createdAccount!.id,
            ...form
        });

        if (createdAccount!.type === 'mam') {
            const derivationIndexes = (createdAccount as AccountMAM).allAvailableDerivations.map(
                d => d.index
            );
            newAcc = await renameDerivations({
                id: createdAccount!.id,
                derivationIndexes,
                emoji: form.emoji
            });
        }

        setEditNamePagePassed(true);
        setCreatedAccount(newAcc);
    };

    const [isMnemonicFormDirty, setIsMnemonicFormDirty] = useState(false);

    const { onOpen: openConfirmDiscard } = useConfirmDiscardNotification();
    const { navigateHome } = useContext(AddWalletContext);
    const onBack = useMemo(() => {
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
            if (isCreatingMam) {
                return undefined;
            }
            return () => setMnemonic(undefined);
        }

        if (existingAccountAndWallet) {
            return () => {
                setExistingAccountAndWallet(undefined);
                setSelectedMnemonicType(undefined);
                setMnemonic(undefined);
            };
        }

        if (editNamePagePassed && !selectNetworksPassed) {
            return () => setEditNamePagePassed(false);
        }

        return undefined;
    }, [
        mnemonic,
        openConfirmDiscard,
        navigateHome,
        existingAccountAndWallet,
        isMnemonicFormDirty,
        selectedMnemonicType,
        isCreatingMam,
        editNamePagePassed,
        selectNetworksPassed
    ]);
    useSetNotificationOnBack(onBack);

    const onCloseInterceptor = useMemo<OnCloseInterceptor>(() => {
        if (!isMnemonicFormDirty) {
            return undefined;
        }

        if (createdAccount || existingAccountAndWallet) {
            return undefined;
        }

        return closeModal => {
            openConfirmDiscard({
                onClose: discard => {
                    if (discard) {
                        closeModal();
                    }
                }
            });
        };
    }, [isMnemonicFormDirty, openConfirmDiscard, createdAccount, existingAccountAndWallet]);
    useSetNotificationOnCloseInterceptor(onCloseInterceptor);

    if (!mnemonic) {
        return (
            <ImportWords
                onMnemonic={onMnemonic}
                isLoading={isProcessMnemonic || processedMnemonicResult !== undefined}
                onIsDirtyChange={setIsMnemonicFormDirty}
            />
        );
    }

    if (!selectedMnemonicType) {
        return (
            <SelectMnemonicType
                availableTypes={availableMnemonicTypes}
                onSelect={onSelectMnemonicType}
                isLoading={isCreatingMam}
            />
        );
    }

    if (existingAccountAndWallet) {
        return (
            <AccountIsAlreadyAdded {...existingAccountAndWallet} onOpenAccount={afterCompleted} />
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

                    createWalletsAsync({
                        mnemonic,
                        versions,
                        selectAccount: true,
                        mnemonicType
                    }).then(setCreatedAccount);
                }}
                isLoading={isCreatingWallets}
            />
        );
    }

    if (!editNamePagePassed) {
        return (
            <UpdateWalletName
                name={createdAccount.name}
                submitHandler={onRename}
                walletEmoji={createdAccount.emoji}
                isLoading={renameAccountLoading || renameDerivationsLoading}
                buttonText={t('continue')}
            />
        );
    }

    if (!selectNetworksPassed) {
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
