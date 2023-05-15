import { useMutation } from '@tanstack/react-query';
import { validateWalletMnemonic } from '@tonkeeper/core/dist/service/menmonicService';
import { getWalletState } from '@tonkeeper/core/dist/service/wallet/storeService';
import React, { FC, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { Button, ButtonRow } from '../../components/fields/Button';
import { Input } from '../../components/fields/Input';
import { TonkeeperIcon } from '../../components/Icon';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useStorage } from '../../hooks/storage';
import { useTranslation } from '../../hooks/translation';
import { AppRoute } from '../../libs/routes';
import { useMutateDeleteAll } from '../../state/account';

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

  position: relative;
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
  const sdk = useAppSdk();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { account } = useAppContext();

  const ref = useRef<HTMLInputElement | null>(null);
  const { mutate: mutateLogOut, isLoading: isLogOutLoading } =
    useMutateDeleteAll();
  const { mutate, isLoading, isError, reset } = useMutateUnlock();
  const [password, setPassword] = useState('');

  const disabled = isLogOutLoading || isLoading;

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

  const onLogOut = async () => {
    const confirm = await sdk.confirm(
      t(
        account.publicKeys.length > 1
          ? 'logout_on_unlock_many'
          : 'logout_on_unlock_one'
      )
    );
    if (confirm) {
      await mutateLogOut();
      navigate(AppRoute.home);
    }
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
      <ButtonRow>
        <Button
          marginTop
          size="large"
          secondary
          fullWidth
          type="button"
          disabled={disabled}
          loading={isLogOutLoading}
          onClick={onLogOut}
        >
          {t('settings_reset')}
        </Button>
        <Button
          marginTop
          size="large"
          primary
          fullWidth
          type="submit"
          disabled={disabled}
          loading={isLoading}
        >
          {t('Unlock')}
        </Button>
      </ButtonRow>
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
