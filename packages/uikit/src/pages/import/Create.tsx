import { mnemonicNew } from '@ton/crypto';
import { AuthState } from '@tonkeeper/core/dist/entries/password';
import { FC, useEffect, useState } from 'react';
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
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { FinalView, useAddWalletMutation } from './Password';
import { Subscribe } from './Subscribe';
import { StandardTonWalletState } from '@tonkeeper/core/dist/entries/wallet';
import { useWalletsState } from '../../state/wallet';

const Create: FC<{ listOfAuth: AuthState['kind'][] }> = ({ listOfAuth }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const {
        mutateAsync: checkPasswordAndCreateWalletAsync,
        isLoading: isConfirmLoading,
        reset
    } = useAddWalletMutation();

    const existingWallets = useWalletsState();
    const [mnemonic, setMnemonic] = useState<string[]>([]);
    const [wallet, setWallet] = useState<StandardTonWalletState | undefined>(undefined);

    const [create, setCreate] = useState(false);
    const [open, setOpen] = useState(false);
    const [check, setCheck] = useState(false);
    const [checked, setChecked] = useState(false);
    const [hasPassword, setHasPassword] = useState(false);
    const [passNotifications, setPassNotification] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            mnemonicNew(24).then(value => setMnemonic(value));
        }, 1500);
    }, []);

    useEffect(() => {
        if (mnemonic.length) {
            setTimeout(() => {
                setCreate(true);
            }, 1500);
        }
    }, [mnemonic]);

    if (mnemonic.length === 0) {
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
                onConfirm={() =>
                    checkPasswordAndCreateWalletAsync({
                        mnemonic,
                        supportedAuthTypes: listOfAuth
                    }).then(state => {
                        setChecked(true);
                        if (state === false) {
                            setHasPassword(false);
                        } else {
                            setHasPassword(true);
                            setWallet(state);
                        }
                    })
                }
                isLoading={isConfirmLoading}
            />
        );
    }

    if (!hasPassword) {
        return (
            <CreateAuthState
                afterCreate={(password?: string) => {
                    reset();
                    checkPasswordAndCreateWalletAsync({ mnemonic, password }).then(state => {
                        if (state !== false) {
                            setHasPassword(true);
                            setWallet(state);
                        }
                    });
                }}
                isLoading={isConfirmLoading}
            />
        );
    }

    if (wallet && existingWallets.length > 1) {
        return (
            <UpdateWalletName
                name={wallet.name}
                submitHandler={val =>
                    setWallet(w => ({
                        ...w!,
                        ...val
                    }))
                }
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
