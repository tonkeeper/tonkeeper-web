import { mnemonicNew } from '@ton/crypto';
import { useEffect, useState } from 'react';
import { IconPage } from '../../components/Layout';
import { CreateAuthState } from '../../components/create/CreateAuth';
import { UpdateWalletName } from '../../components/create/WalletName';
import { Check, Worlds } from '../../components/create/Words';
import { Button } from '../../components/fields/Button';
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
import { StandardTonWalletState } from '@tonkeeper/core/dist/entries/wallet';
import { useCreateStandardTonWalletsByMnemonic, useWalletsState } from '../../state/wallet';

const Create = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { defaultWalletVersion } = useAppContext();
    const {
        mutateAsync: createWalletsAsync,
        isLoading: isCreateWalletLoading,
        reset: resetCreateWallets
    } = useCreateStandardTonWalletsByMnemonic();

    const existingWallets = useWalletsState();
    const [mnemonic, setMnemonic] = useState<string[] | undefined>();
    const [wallet, setWallet] = useState<StandardTonWalletState | undefined>(undefined);

    const [create, setCreate] = useState(false);
    const [open, setOpen] = useState(false);
    const [check, setCheck] = useState(false);
    const [checked, setChecked] = useState(false);
    const [createdPassword, setCreatedPassword] = useState<string | undefined>();
    const [passName, setPassName] = useState(false);
    const [passNotifications, setPassNotification] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            mnemonicNew(24).then(value => setMnemonic(value));
        }, 1500);
    }, []);

    useEffect(() => {
        if (mnemonic) {
            setTimeout(() => {
                setCreate(true);
            }, 1500);
        }
    }, [mnemonic]);

    const authExists = createdPassword || existingWallets.length >= 1;

    useEffect(() => {
        if (authExists && mnemonic && checked) {
            createWalletsAsync({
                mnemonic,
                password: createdPassword,
                versions: [defaultWalletVersion],
                activateFirstWallet: true
            }).then(result => {
                setWallet(result[0]);
            });
        }

        return resetCreateWallets;
    }, [authExists, createdPassword, mnemonic, checked, createWalletsAsync, defaultWalletVersion]);

    if (!mnemonic) {
        return <IconPage icon={<GearLottieIcon />} title={t('create_wallet_generating')} />;
    }

    if (!create) {
        return <IconPage icon={<CheckLottieIcon />} title={t('create_wallet_generated')} />;
    }

    if (!open) {
        return (
            <IconPage
                logOut
                icon={<WriteLottieIcon />}
                title={t('create_wallet_title')}
                description={t('create_wallet_caption')}
                button={
                    <Button size="large" fullWidth primary marginTop onClick={() => setOpen(true)}>
                        {t('continue')}
                    </Button>
                }
            />
        );
    }

    if (!check) {
        return (
            <Worlds
                mnemonic={mnemonic}
                onBack={() => setOpen(false)}
                onCheck={() => setCheck(true)}
            />
        );
    }

    if (!checked) {
        return (
            <Check
                mnemonic={mnemonic}
                onBack={() => setCheck(false)}
                onConfirm={() => setChecked(true)}
                isLoading={isCreateWalletLoading}
            />
        );
    }

    if (authExists) {
        if (!wallet) {
            return (
                <Check
                    mnemonic={mnemonic}
                    onBack={() => setCheck(false)}
                    onConfirm={() => setChecked(true)}
                    isLoading={isCreateWalletLoading}
                />
            );
        }
    } else {
        if (!checked) {
            return (
                <Check
                    mnemonic={mnemonic}
                    onBack={() => setCheck(false)}
                    onConfirm={() => setChecked(true)}
                />
            );
        }

        if (!wallet) {
            return (
                <CreateAuthState
                    afterCreate={setCreatedPassword}
                    isLoading={isCreateWalletLoading}
                />
            );
        }
    }

    if (existingWallets.length > 1 && !passName) {
        return (
            <UpdateWalletName
                name={wallet.name}
                submitHandler={val => {
                    setWallet(w => ({
                        ...w!,
                        ...val
                    }));
                    setPassName(true);
                }}
                walletEmoji={wallet.emoji}
            />
        );
    }

    if (sdk.notifications && !passNotifications) {
        return (
            <Subscribe
                wallet={wallet!}
                mnemonic={mnemonic}
                onDone={() => setPassNotification(true)}
            />
        );
    }

    return <FinalView />;
};

export default Create;
