import { useMutation } from '@tanstack/react-query';
import { validateWalletMnemonic } from '@tonkeeper/core/dist/service/menmonicService';
import { getWalletState } from '@tonkeeper/core/dist/service/wallet/storeService';
import React, { FC, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { Button } from '../../components/fields/Button';
import { Input } from '../../components/fields/Input';
import { TonkeeperIcon } from '../../components/Icon';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useStorage } from '../../hooks/storage';
import { useTranslation } from '../../hooks/translation';

const Block = styled.form<{ minHeight?: string }>`
  display: flex;
  flex-direction: column;
  ${(props) =>
    css`
      min-height: ${props.minHeight ?? 'var(--app-height)'};
    `}

  padding: 2rem 1rem;
  box-sizing: border-box;

  justify-content: center;
  gap: 1rem;
`;

const Logo = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  font-size: 400%;

  margin-bottom: 2rem;
`;

const useMutateUnlock = () => {
  const { account } = useAppContext();
  const sdk = useAppSdk();
  const storage = useStorage();

  return useMutation<void, Error, string>(async (password) => {
    if (account.publicKeys.length === 0) {
      throw new Error('Missing wallets');
    }
    const [publicKey] = account.publicKeys;
    const wallet = await getWalletState(storage, publicKey);
    if (!wallet) {
      throw new Error('Missing wallet');
    }

    const isValid = await validateWalletMnemonic(storage, publicKey, password);
    if (!isValid) {
      throw new Error('Mnemonic not valid');
    }
    sdk.uiEvents.emit('unlock');
  });
};

export const PasswordUnlock: FC<{ minHeight?: string }> = ({ minHeight }) => {
  const { t } = useTranslation();

  const ref = useRef<HTMLInputElement | null>(null);
  const { mutate, isLoading, isError, reset } = useMutateUnlock();
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [ref.current]);

  const onChange = (value: string) => {
    reset();
    setPassword(value);
  };

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    mutate(password);
  };

  return (
    <Block minHeight={minHeight} onSubmit={onSubmit}>
      <Logo>
        <TonkeeperIcon />
      </Logo>
      <Input
        ref={ref}
        value={password}
        onChange={onChange}
        type="password"
        label={t('Password')}
        isValid={!isError}
        disabled={isLoading}
      />
      <Button size="large" primary fullWidth type="submit" loading={isLoading}>
        {t('Unlock')}
      </Button>
    </Block>
  );
};

export const Unlock = () => {
  const { auth } = useAppContext();

  if (auth.kind === 'password') {
    return <PasswordUnlock />;
  } else {
    return <div>Other auth</div>;
  }
};
