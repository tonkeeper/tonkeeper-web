import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import React, { FC, useCallback, useState } from 'react';
import { useTranslation } from '../../hooks/translation';
import { useMutateRenameWallet } from '../../state/wallet';
import { Button } from '../fields/Button';
import { Input } from '../fields/Input';
import { Notification, NotificationBlock } from '../Notification';

const RenameWalletContent: FC<{
  wallet: WalletState;
  afterClose: (action: () => void) => void;
}> = ({ afterClose, wallet }) => {
  const { t } = useTranslation();

  const { mutateAsync, isLoading, isError } = useMutateRenameWallet(wallet);

  const [name, setName] = useState(wallet.name ?? '');
  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    await mutateAsync(name);
    afterClose(() => null);
  };

  return (
    <>
      <NotificationBlock onSubmit={onSubmit}>
        <Input
          value={name}
          onChange={setName}
          isValid={!isError}
          label={t('Wallet_name')}
        />
        <Input
          value={wallet.active.friendlyAddress}
          disabled
          label={t('address_label')}
        />

        <Button
          size="large"
          fullWidth
          bottom
          primary
          loading={isLoading}
          disabled={isLoading}
          type="submit"
        >
          {t('add_edit_favorite_save')}
        </Button>
      </NotificationBlock>
    </>
  );
};

export const RenameWalletNotification: FC<{
  wallet?: WalletState;
  handleClose: () => void;
}> = ({ wallet, handleClose }) => {
  const { t } = useTranslation();

  const Content = useCallback(
    (afterClose: (action: () => void) => void) => {
      if (!wallet) return undefined;
      return <RenameWalletContent wallet={wallet} afterClose={afterClose} />;
    },
    [wallet]
  );

  return (
    <Notification
      isOpen={wallet != null}
      handleClose={handleClose}
      hideButton
      title={t('Rename')}
    >
      {Content}
    </Notification>
  );
};
