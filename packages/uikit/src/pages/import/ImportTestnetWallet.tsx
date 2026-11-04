import React, { FC, useContext, useMemo, useState } from 'react';
import { CustomizeWallet, CustomizeWalletForm } from '../../components/create/CustomizeWallet';
import { MnemonicInputForm } from '../../components/create/MnemonicInputForm';
import { ImportMnemonicType } from '../../components/create/SelectMnemonicType';
import { useAppSdk } from '../../hooks/appSdk';
import { FinalView } from './Password';
import { Subscribe } from './Subscribe';
import {
    useAccountsState,
    useCreateAccountTestnet,
    useMutateRenameAccount
} from '../../state/wallet';
import { useMutateWalletColor, useWalletColorResolver } from '../../state/walletColor';
import { ChoseWalletVersionsByMnemonic } from '../../components/create/ChoseWalletVersions';
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
    useSetModalOnBack,
    useSetModalOnCloseInterceptor
} from '../../primitives/Modal';
import { useMutation } from '@tanstack/react-query';
import { useUserFiat } from '../../state/fiat';
import { mnemonicValidate } from '@ton/crypto';
import { mnemonicToKeypair } from '@tonkeeper/core/dist/service/mnemonicService';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { useImportFlowAnalytics } from '../../hooks/analytics/wallet-flow';

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

    const importAnalytics = useImportFlowAnalytics('mnemonic');

    const onMnemonic = async (m: string[]) => {
        try {
            const result = await processMnemonic(m);
            if (result.tonMnemonic) {
                setSelectedMnemonicType('tonMnemonic');
            }
            setMnemonic(m);
        } catch (e) {
            importAnalytics.error(e);
            throw e;
        }
    };

    const resolveWalletColor = useWalletColorResolver();
    const { setWalletColor } = useMutateWalletColor();
    const onRename = async ({ name, emoji, colorId }: CustomizeWalletForm) => {
        await setWalletColor(createdAccount!.id, colorId);
        const newAcc: AccountTonTestnet = await renameAccount({
            id: createdAccount!.id,
            name,
            emoji
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

    if (!mnemonic) {
        return (
            <MnemonicInputForm
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
            <ChoseWalletVersionsByMnemonic
                network={Network.TESTNET}
                mnemonic={mnemonic}
                mnemonicType={'ton'}
                onSubmit={versions => {
                    createWalletsAsync({
                        mnemonic,
                        versions,
                        selectAccount: true,
                        mnemonicType: 'ton'
                    }).then(account => {
                        setCreatedAccount(account);
                        importAnalytics.success();
                    }, importAnalytics.error);
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
