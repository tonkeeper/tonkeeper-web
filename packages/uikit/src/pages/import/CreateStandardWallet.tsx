import { mnemonicNew } from '@ton/crypto';
import React, { FC, useContext, useEffect, useMemo, useState } from 'react';
import { IconPage } from '../../components/Layout';
import { UpdateWalletName } from '../../components/create/WalletName';
import { Check, Words } from '../../components/create/Words';
import { ButtonResponsiveSize } from '../../components/fields/Button';
import {
    CheckLottieIcon,
    GearLottieIcon,
    WriteLottieIcon
} from '../../components/lottie/LottieIcons';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { FinalView } from './Password';
import { Subscribe } from './Subscribe';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { useCreateAccountMnemonic, useMutateRenameAccount } from '../../state/wallet';
import {
    OnCloseInterceptor,
    useSetNotificationOnBack,
    useSetNotificationOnCloseInterceptor
} from '../../components/Notification';
import { useConfirmDiscardNotification } from '../../components/modals/ConfirmDiscardNotificationControlled';
import { AddWalletContext } from '../../components/create/AddWalletContext';
import { SelectWalletNetworks } from '../../components/create/SelectWalletNetworks';

export const CreateStandardWallet: FC<{ afterCompleted: () => void }> = ({ afterCompleted }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { defaultWalletVersion } = useAppContext();
    const { mutateAsync: createWalletsAsync, isLoading: isCreateWalletLoading } =
        useCreateAccountMnemonic();
    const { mutateAsync: renameWallet, isLoading: renameLoading } = useMutateRenameAccount();

    const [mnemonic, setMnemonic] = useState<string[] | undefined>();
    const [createdAccount, setCreatedAccount] = useState<Account | undefined>(undefined);

    const [creatingAnimationPassed, setCreatingAnimationPassed] = useState(false);
    const [infoPagePassed, setInfoPagePassed] = useState(false);
    const [wordsPagePassed, setWordsPagePassed] = useState(false);
    const [editNamePagePassed, setEditNamePagePassed] = useState(false);
    const [selectNetworksPassed, setSelectNetworksPassed] = useState(false);
    const [notificationsSubscribePagePassed, setPassNotification] = useState(false);

    const [wordsShown, setWordsShown] = useState(false);

    useEffect(() => {
        if (infoPagePassed) {
            setWordsShown(true);
        }
    }, [infoPagePassed]);

    useEffect(() => {
        setTimeout(() => {
            mnemonicNew(24).then(value => setMnemonic(value));
        }, 1500);
    }, []);

    useEffect(() => {
        if (mnemonic) {
            setTimeout(() => {
                setCreatingAnimationPassed(true);
            }, 1500);
        }
    }, [mnemonic]);

    const { onOpen: openConfirmDiscard } = useConfirmDiscardNotification();
    const { navigateHome } = useContext(AddWalletContext);
    const onBack = useMemo(() => {
        if (!infoPagePassed) {
            if (!wordsShown) {
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

        if (!wordsPagePassed) {
            return () => setInfoPagePassed(false);
        }

        if (!createdAccount) {
            return () => setWordsPagePassed(false);
        }

        if (editNamePagePassed && !selectNetworksPassed) {
            return () => setEditNamePagePassed(false);
        }

        return undefined;
    }, [
        wordsShown,
        openConfirmDiscard,
        navigateHome,
        infoPagePassed,
        wordsPagePassed,
        createdAccount,
        editNamePagePassed,
        selectNetworksPassed
    ]);
    useSetNotificationOnBack(onBack);

    const onCloseInterceptor = useMemo<OnCloseInterceptor>(() => {
        if (!wordsShown) {
            return undefined;
        }

        if (createdAccount) {
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
    }, [wordsShown, openConfirmDiscard, createdAccount]);
    useSetNotificationOnCloseInterceptor(onCloseInterceptor);

    if (!mnemonic) {
        return <IconPage icon={<GearLottieIcon />} title={t('create_wallet_generating')} />;
    }

    if (!creatingAnimationPassed) {
        return <IconPage icon={<CheckLottieIcon />} title={t('create_wallet_generated')} />;
    }

    if (!infoPagePassed) {
        return (
            <IconPage
                icon={<WriteLottieIcon />}
                title={t('create_wallet_title')}
                description={t('create_wallet_caption')}
                button={
                    <ButtonResponsiveSize
                        fullWidth
                        primary
                        marginTop
                        onClick={() => setInfoPagePassed(true)}
                    >
                        {t('continue')}
                    </ButtonResponsiveSize>
                }
            />
        );
    }

    if (!wordsPagePassed) {
        return <Words mnemonic={mnemonic} onCheck={() => setWordsPagePassed(true)} />;
    }

    if (!createdAccount) {
        return (
            <Check
                mnemonic={mnemonic}
                onConfirm={() => {
                    createWalletsAsync({
                        mnemonic,
                        versions: [defaultWalletVersion],
                        selectAccount: true,
                        mnemonicType: 'ton'
                    }).then(setCreatedAccount);
                }}
                isLoading={isCreateWalletLoading}
            />
        );
    }

    if (!editNamePagePassed) {
        return (
            <UpdateWalletName
                name={createdAccount.name}
                submitHandler={val => {
                    renameWallet({
                        id: createdAccount.id,
                        ...val
                    }).then(newAcc => {
                        setEditNamePagePassed(true);
                        setCreatedAccount(newAcc);
                    });
                }}
                walletEmoji={createdAccount.emoji}
                isLoading={renameLoading}
                buttonText={t('continue')}
            />
        );
    }

    if (!selectNetworksPassed) {
        return <SelectWalletNetworks onContinue={() => setSelectNetworksPassed(true)} />;
    }

    if (sdk.notifications && !notificationsSubscribePagePassed) {
        return (
            <Subscribe
                mnemonicType="ton"
                wallet={createdAccount.activeTonWallet}
                mnemonic={mnemonic}
                onDone={() => setPassNotification(true)}
            />
        );
    }

    return <FinalView afterCompleted={afterCompleted} />;
};
