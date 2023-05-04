import { AccountState } from '@tonkeeper/core/dist/entries/account';
import React, { useState } from 'react';
import { CreateAuthState } from '../../components/create/CreateAuth';
import { UpdateWalletName } from '../../components/create/WalletName';
import { ImportWords } from '../../components/create/Words';
import { useActiveWallet } from '../../state/wallet';
import { FinalView, useAddWalletMutation } from './Password';

export const Import = () => {
  //useKeyboardHeight();
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [account, setAccount] = useState<AccountState | undefined>(undefined);
  const [hasPassword, setHasPassword] = useState(false);

  const { data: wallet } = useActiveWallet();

  const {
    mutateAsync: checkPasswordAndCreateWalletAsync,
    isLoading: isConfirmLoading,
    reset,
  } = useAddWalletMutation();

  if (mnemonic.length === 0) {
    return (
      <ImportWords
        isLoading={isConfirmLoading}
        onMnemonic={(mnemonic) => {
          checkPasswordAndCreateWalletAsync({ mnemonic }).then((state) => {
            setMnemonic(mnemonic);
            if (state === false) {
              setHasPassword(false);
            } else {
              setHasPassword(true);
              setAccount(state);
            }
          });
        }}
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
