import { AccountState } from '@tonkeeper/core/dist/entries/account';
import React, { useEffect, useState } from 'react';
import { mnemonicNew } from 'ton-crypto';
import { CreateAuthState } from '../../components/create/CreateAuth';
import { UpdateWalletName } from '../../components/create/WalletName';
import { Check, Worlds } from '../../components/create/Words';
import { Button } from '../../components/fields/Button';
import { IconPage } from '../../components/Layout';
import {
  CheckLottieIcon,
  GearLottieIcon,
  WriteLottieIcon,
} from '../../components/lottie/LottieIcons';
import { useTranslation } from '../../hooks/translation';
import { useActiveWallet } from '../../state/wallet';
import { useKeyboardHeight } from './hooks';
import { FinalView, useAddWalletMutation } from './Password';

export const Create = () => {
  useKeyboardHeight();
  const { t } = useTranslation();
  const {
    mutateAsync: checkPasswordAndCreateWalletAsync,
    isLoading: isConfirmLoading,
    reset,
  } = useAddWalletMutation();

  const { data: wallet } = useActiveWallet();
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [account, setAccount] = useState<AccountState | undefined>(undefined);

  const [create, setCreate] = useState(false);
  const [open, setOpen] = useState(false);
  const [check, setCheck] = useState(false);
  const [checked, setChecked] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      mnemonicNew(24).then((value) => setMnemonic(value));
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
    return (
      <IconPage
        icon={<GearLottieIcon />}
        title={t('create_wallet_generating')}
      />
    );
  }

  if (!create) {
    return (
      <IconPage
        icon={<CheckLottieIcon />}
        title={t('create_wallet_generated')}
      />
    );
  }

  if (!open) {
    return (
      <IconPage
        logOut
        icon={<WriteLottieIcon />}
        title={t('create_wallet_title')}
        description={t('create_wallet_caption')}
        button={
          <Button
            size="large"
            fullWidth
            primary
            marginTop
            onClick={() => setOpen(true)}
          >
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
          checkPasswordAndCreateWalletAsync({ mnemonic }).then((state) => {
            setChecked(true);
            if (state === false) {
              setHasPassword(false);
            } else {
              setHasPassword(true);
              setAccount(state);
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
          checkPasswordAndCreateWalletAsync({ mnemonic, password }).then(
            (state) => {
              if (state !== false) {
                setHasPassword(true);
                setAccount(state);
              }
            }
          );
        }}
        isLoading={isConfirmLoading}
      />
    );
  }

  if (
    account &&
    account.publicKeys.length > 1 &&
    wallet &&
    wallet.name == null
  ) {
    return <UpdateWalletName account={account} onUpdate={setAccount} />;
  }

  return <FinalView />;
};
