import React, { FC, useContext, useMemo, useState } from 'react';
import { UpdateWalletName } from '../../components/create/WalletName';
import { ImportMnemonicType, ImportWords, SelectMnemonicType } from '../../components/create/Words';
import { useAppSdk } from '../../hooks/appSdk';
import { FinalView } from './Password';
import { Subscribe } from './Subscribe';
import {
    useAccountsState,
    useCreateAccountTestnet,
    useMutateRenameAccount
} from '../../state/wallet';
import { ChoseWalletVersions } from '../../components/create/ChoseWalletVersions';
import { AccountTonTestnet, getAccountByWalletById } from '@tonkeeper/core/dist/entries/account';
import {
    createStandardTestnetAccountByMnemonic,
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
import { mnemonicToKeypair } from '@tonkeeper/core/dist/service/mnemonicService';
import { Network } from '@tonkeeper/core/dist/entries/network';

const useProcessMnemonic = () => {
    const context = useAppContext();
    const fiat = useUserFiat();
    const sdk = useAppSdk();
    const accounts = useAccountsState();

    return useMutation<
        {
            tonMnemonic:
                | {
                      type: 'select-versions';
                  }
                | { type: 'exisiting'; account: Account; walletId: WalletId }
                | undefined;
        },
        Error,
        string[]
    >(async mnemonic => {
        const isValidForStandardWallet = await mnemonicValidate(mnemonic);

        let tonMnemonic = undefined;
        if (isValidForStandardWallet) {
            const possibleStadnardAccount = await createStandardTestnetAccountByMnemonic(
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
                    ]
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
                    network: Network.TESTNET,
                    appContext: context,
                    fiat
                });
                if (versions.some(v => v.tonBalance || v.hasJettons)) {
                    tonMnemonic = { type: 'select-versions' } as const;
                }
            }
        }

        return { tonMnemonic };
    });
};

export const ImportTestnetWallet: FC<{ afterCompleted: () => void }> = ({ afterCompleted }) => {
    const sdk = useAppSdk();

    const [mnemonic, setMnemonic] = useState<string[] | undefined>();
    const [createdAccount, setCreatedAccount] = useState<AccountTonTestnet | undefined>(undefined);
    const [existingAccountAndWallet, setExistingAccountAndWallet] = useState<
        | {
              account: Account;
              walletId: WalletId;
          }
        | undefined
    >();

    const [editNamePagePassed, setEditNamePagePassed] = useState(false);
    const [notificationsSubscribePagePassed, setNotificationsSubscribePagePassed] = useState(false);
    const { mutateAsync: renameAccount, isLoading: renameAccountLoading } =
        useMutateRenameAccount<AccountTonTestnet>();

    const { mutateAsync: createWalletsAsync, isLoading: isCreatingWallets } =
        useCreateAccountTestnet();

    const {
        mutateAsync: processMnemonic,
        isLoading: isProcessMnemonic,
        data: processedMnemonicResult
    } = useProcessMnemonic();

    const [selectedMnemonicType, setSelectedMnemonicType] = useState<ImportMnemonicType>();

    const onMnemonic = async (m: string[]) => {
        const result = await processMnemonic(m);
        if (result.tonMnemonic) {
            setSelectedMnemonicType('tonMnemonic');
        }
        setMnemonic(m);
    };

    const onRename = async (form: { name: string; emoji: string }) => {
        let newAcc: AccountTonTestnet = await renameAccount({
            id: createdAccount!.id,
            ...form
        });
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
            return () => setMnemonic(undefined);
        }

        if (existingAccountAndWallet) {
            return () => {
                setExistingAccountAndWallet(undefined);
                setSelectedMnemonicType(undefined);
                setMnemonic(undefined);
            };
        }

        return undefined;
    }, [
        mnemonic,
        openConfirmDiscard,
        navigateHome,
        existingAccountAndWallet,
        isMnemonicFormDirty,
        selectedMnemonicType
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
                enableShortMnemonic={false}
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
            <ChoseWalletVersions
                network={Network.TESTNET}
                mnemonic={mnemonic}
                mnemonicType={'ton'}
                onSubmit={versions => {
                    createWalletsAsync({
                        mnemonic,
                        versions,
                        selectAccount: true,
                        mnemonicType: 'ton'
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
                isLoading={renameAccountLoading}
            />
        );
    }

    if (sdk.notifications && !notificationsSubscribePagePassed) {
        return (
            <Subscribe
                mnemonicType={'ton'}
                wallet={createdAccount.activeTonWallet}
                mnemonic={mnemonic}
                onDone={() => setNotificationsSubscribePagePassed(true)}
            />
        );
    }

    return <FinalView afterCompleted={afterCompleted} />;
};
