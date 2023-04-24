import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AccountState } from '@tonkeeper/core/dist/entries/account';
import { getWalletState } from '@tonkeeper/core/dist/service/wallet/storeService';
import { updateWalletProperty } from '@tonkeeper/core/dist/service/walletService';
import React, { FC, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useStorage } from '../../hooks/storage';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { Button } from '../fields/Button';
import { Input } from '../fields/Input';
import { CenterContainer } from '../Layout';
import { Body2, H2 } from '../Text';

const Block = styled.form`
  display: flex;
  text-align: center;
  gap: 1rem;
  flex-direction: column;
`;

const Body = styled(Body2)`
  text-align: center;
  color: ${(props) => props.theme.textSecondary};
`;

const useUpdateNameMutation = (account: AccountState) => {
  const storage = useStorage();
  const client = useQueryClient();
  const { tonApi } = useAppContext();
  return useMutation<AccountState, Error, string>(async (name) => {
    if (name.length < 3) {
      throw new Error('Missing name');
    }

    if (!account.activePublicKey) {
      throw new Error('Missing activePublicKey');
    }
    const wallet = await getWalletState(storage, account.activePublicKey);
    if (!wallet) {
      throw new Error('Missing wallet');
    }

    await updateWalletProperty(tonApi, storage, wallet, { name });
    await client.invalidateQueries([QueryKey.account]);
    return account;
  });
};

export const UpdateWalletName: FC<{
  account: AccountState;
  onUpdate: (account: AccountState) => void;
}> = ({ account, onUpdate }) => {
  const { t } = useTranslation();

  const ref = useRef<HTMLInputElement | null>(null);

  const { mutateAsync, isError, isLoading, reset } =
    useUpdateNameMutation(account);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [ref.current]);

  const [name, setName] = useState('');

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    onUpdate(await mutateAsync(name));
  };

  const onChange = (value: string) => {
    reset();
    setName(value);
  };

  return (
    <CenterContainer>
      <Block onSubmit={onSubmit}>
        <div>
          <H2>{t('Name_your_wallet')}</H2>
          <Body>{t('Name_your_wallet_description')}</Body>
        </div>

        <Input
          ref={ref}
          value={name}
          onChange={onChange}
          label={t('Wallet_name')}
          disabled={isLoading}
          isValid={!isError}
        />

        <Button
          size="large"
          fullWidth
          marginTop
          primary
          loading={isLoading}
          disabled={isLoading}
          type="submit"
        >
          {t('add_edit_favorite_save')}
        </Button>
      </Block>
    </CenterContainer>
  );
};
