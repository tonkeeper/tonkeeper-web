import { useMutation } from '@tanstack/react-query';
import {
  GetPasswordParams,
  GetPasswordType,
  IAppSdk,
} from '@tonkeeper/core/dist/AppSdk';
import { AuthState } from '@tonkeeper/core/dist/entries/password';
import { getAccountState } from '@tonkeeper/core/dist/service/accountService';
import { validateWalletMnemonic } from '@tonkeeper/core/dist/service/menmonicService';
import { getWalletState } from '@tonkeeper/core/dist/service/walletService';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Button, ButtonRow } from '../../components/fields/Button';
import { Input } from '../../components/fields/Input';
import { Notification } from '../../components/Notification';
import { useTranslation } from '../../hooks/translation';

export const getPasswordByNotification = async (
  sdk: IAppSdk,
  auth: AuthState,
  type?: GetPasswordType
): Promise<string> => {
  const id = Date.now();
  return new Promise<string>((resolve, reject) => {
    sdk.uiEvents.emit('getPassword', {
      method: 'getPassword',
      id,
      params: { type, auth },
    });

    const onCallback = (message: {
      method: 'response';
      id?: number | undefined;
      params: string | Error;
    }) => {
      if (message.id === id) {
        const { params } = message;
        sdk.uiEvents.off('response', onCallback);

        if (typeof params === 'string') {
          resolve(params);
        } else {
          reject(params);
        }
      }
    };

    sdk.uiEvents.on('response', onCallback);
  });
};

const Block = styled.form<{ padding: number }>`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  justify-content: center;
  gap: 2rem;
  width: 100%;

  padding-bottom: ${(props) => props.padding}px;
`;

const useMutateUnlock = (sdk: IAppSdk, requestId?: number) => {
  return useMutation<void, Error, string>(async (password) => {
    const account = await getAccountState(sdk.storage);
    if (account.publicKeys.length === 0) {
      throw new Error('Missing wallets');
    }
    const [publicKey] = account.publicKeys;
    const wallet = await getWalletState(sdk.storage, publicKey);
    if (!wallet) {
      throw new Error('Missing wallet');
    }

    const isValid = await validateWalletMnemonic(
      sdk.storage,
      publicKey,
      password
    );
    if (!isValid) {
      throw new Error('Mnemonic not valid');
    }

    sdk.uiEvents.emit('response', {
      method: 'response',
      id: requestId,
      params: password,
    });
  });
};

const PasswordUnlock: FC<{
  sdk: IAppSdk;
  onClose: () => void;
  onSubmit: (password: string) => void;
  isError: boolean;
  isLoading: boolean;
  reason?: GetPasswordType;
}> = ({ sdk, onClose, onSubmit, isError, isLoading, reason }) => {
  const { t } = useTranslation();

  const ref = useRef<HTMLInputElement | null>(null);
  const [password, setPassword] = useState('');
  const [active, setActive] = useState(false);
  const location = useLocation();

  const [padding, setPadding] = useState(0);

  useEffect(() => {
    if (!active) {
      setActive(true);
    } else {
      onClose();
    }
  }, [location]);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [ref.current]);

  const onChange = (value: string) => {
    setPassword(value);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <Block onSubmit={handleSubmit} padding={padding}>
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
          size="large"
          fullWidth
          onClick={onClose}
          type="button"
          loading={isLoading}
        >
          {reason === 'confirm' ? t('cancel') : t('settings_reset')}
        </Button>
        <Button
          size="large"
          primary
          fullWidth
          type="submit"
          disabled={password.length < 5}
          loading={isLoading}
        >
          {reason === 'confirm' ? t('confirm_sending_submit') : t('Unlock')}
        </Button>
      </ButtonRow>
    </Block>
  );
};

export const UnlockNotification: FC<{ sdk: IAppSdk }> = ({ sdk }) => {
  const { t } = useTranslation();

  const [type, setType] = useState<'confirm' | 'unlock' | undefined>(undefined);
  const [auth, setAuth] = useState<AuthState | undefined>(undefined);
  const [requestId, setId] = useState<number | undefined>(undefined);

  const { mutateAsync, isLoading, isError, reset } = useMutateUnlock(
    sdk,
    requestId
  );

  const close = useCallback(() => {
    setAuth(undefined);
    setId(undefined);
  }, []);

  const onSubmit = async (password: string) => {
    reset();
    await mutateAsync(password);
    close();
  };

  const onCancel = () => {
    console.log('cancel');
    sdk.uiEvents.emit('response', {
      method: 'response',
      id: requestId,
      params: new Error('Cancel auth request'),
    });
    close();
  };

  useEffect(() => {
    const handler = (options: {
      method: 'getPassword';
      id?: number | undefined;
      params: GetPasswordParams;
    }) => {
      setType(options.params.type);
      setAuth(options.params?.auth);
      setId(options.id);
    };
    sdk.uiEvents.on('getPassword', handler);

    return () => {
      sdk.uiEvents.off('getPassword', handler);
    };
  }, [sdk]);

  const Content = useCallback(() => {
    if (!auth || !requestId) return undefined;
    return (
      <PasswordUnlock
        sdk={sdk}
        onClose={onCancel}
        onSubmit={onSubmit}
        isLoading={isLoading}
        isError={isError}
        reason={type}
      />
    );
  }, [sdk, auth, requestId, onSubmit, type]);

  return (
    <Notification
      isOpen={auth != null}
      hideButton
      handleClose={onCancel}
      title={t('enter_password')}
    >
      {Content}
    </Notification>
  );
};
