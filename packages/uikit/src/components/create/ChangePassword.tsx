import { useMutation } from '@tanstack/react-query';
import { accountChangePassword } from '@tonkeeper/core/dist/service/accountService';
import React, { FC, useCallback, useState } from 'react';
import styled from 'styled-components';
import { useStorage } from '../../hooks/storage';
import { useTranslation } from '../../hooks/translation';
import { Button } from '../fields/Button';
import { Input } from '../fields/Input';
import { Notification, NotificationBlock } from '../Notification';
import { H2 } from '../Text';

const Block = styled.div`
  display: flex;
  text-align: center;
  gap: 1rem;
  flex-direction: column;
  width: 100%;
`;

const useUpdatePassword = () => {
  const storage = useStorage();
  return useMutation<
    string | undefined,
    Error,
    { old: string; password: string; confirm: string }
  >((options) => accountChangePassword(storage, options));
};

const ModalBlock = styled(NotificationBlock)`
  margin-bottom: 3rem;
`;
const ChangePasswordContent: FC<{ handleClose: () => void }> = ({
  handleClose,
}) => {
  const { t } = useTranslation();

  const [error, setError] = useState<string | undefined>(undefined);

  const { mutateAsync, isLoading, reset } = useUpdatePassword();

  const [old, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const onUpdate: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    reset();

    const error = await mutateAsync({ old, password, confirm });
    if (error) {
      setError(error);
    } else {
      handleClose();
    }
  };

  return (
    <ModalBlock onSubmit={onUpdate}>
      <H2>{t('Change_password')}</H2>

      <Input
        type="password"
        label={t('Old_password')}
        value={old}
        onChange={(value) => {
          setError(undefined);
          setOldPassword(value);
        }}
        isValid={error !== 'invalid-old'}
      />

      <Block>
        <Input
          type="password"
          label={t('Password')}
          value={password}
          onChange={(value) => {
            setError(undefined);
            setPassword(value);
          }}
          isValid={error !== 'invalid-password'}
        />

        <Input
          type="password"
          label={t('nft_confirm_operation')}
          value={confirm}
          onChange={(value) => {
            setError(undefined);
            setConfirm(value);
          }}
          isValid={error !== 'invalid-confirm'}
        />
      </Block>
      <Button
        size="large"
        fullWidth
        primary
        type="submit"
        loading={isLoading}
        disabled={isLoading || error != null}
      >
        {t('Change')}
      </Button>
    </ModalBlock>
  );
};

export const ChangePasswordNotification: FC<{
  isOpen: boolean;
  handleClose: () => void;
}> = ({ isOpen, handleClose }) => {
  const Content = useCallback((onClose: () => void) => {
    return <ChangePasswordContent handleClose={onClose} />;
  }, []);

  return (
    <Notification isOpen={isOpen} handleClose={handleClose}>
      {Content}
    </Notification>
  );
};
