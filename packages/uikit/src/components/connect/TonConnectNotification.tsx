import { useMutation } from '@tanstack/react-query';
import {
  ConnectItem,
  ConnectRequest,
} from '@tonkeeper/core/dist/entries/tonConnect';
import React, { FC, useCallback, useState } from 'react';
import styled from 'styled-components';
import { useWalletContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { Button } from '../fields/Button';
import { CheckmarkCircleIcon, ExclamationMarkCircleIcon } from '../Icon';
import { Notification, NotificationBlock } from '../Notification';
import { Body2, Label2 } from '../Text';
import { ResultButton } from '../transfer/common';

const useConnectMutation = (params: ConnectRequest, origin?: string) => {
  return useMutation<ConnectItem[], Error>(async () => {
    console.log(params);
    return [];
  });
};

const Notes = styled(Body2)`
  display: block;
  color: ${(props) => props.theme.textSecondary};
  text-align: center;
`;

const ConnectContent: FC<{
  origin?: string;
  params: ConnectRequest;
  handleClose: (result?: ConnectItem[]) => void;
}> = ({ params, origin, handleClose }) => {
  const [done, setDone] = useState(false);

  const wallet = useWalletContext();

  const { t } = useTranslation();

  const { mutateAsync, isLoading, error } = useConnectMutation(params, origin);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const result = await mutateAsync();
    setDone(true);
    setTimeout(() => handleClose(result), 300);
  };

  return (
    <NotificationBlock onSubmit={onSubmit}>
      <>
        {done && (
          <ResultButton done>
            <CheckmarkCircleIcon />
            <Label2>{t('send_screen_steps_done_done_label')}</Label2>
          </ResultButton>
        )}
        {error && (
          <ResultButton>
            <ExclamationMarkCircleIcon />
            <Label2>{t('send_publish_tx_error')}</Label2>
          </ResultButton>
        )}
        {!done && !error && (
          <Button
            size="large"
            fullWidth
            primary
            loading={isLoading}
            disabled={isLoading}
            type="submit"
          >
            {t('ton_login_connect_button')}
          </Button>
        )}
      </>
      <Notes>{t('ton_login_notice')}</Notes>
    </NotificationBlock>
  );
};

export const TonConnectNotification: FC<{
  origin?: string;
  params: ConnectRequest | null;
  handleClose: () => void;
}> = ({ params, handleClose }) => {
  const Content = useCallback(() => {
    if (!params) return undefined;
    return (
      <ConnectContent
        origin={origin}
        params={params}
        handleClose={handleClose}
      />
    );
  }, [params, handleClose]);

  return (
    <Notification isOpen={params != null} handleClose={handleClose} hideButton>
      {Content}
    </Notification>
  );
};
