import { useMutation, useQuery } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { AuthState } from '@tonkeeper/core/dist/entries/password';
import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import {
  estimateTonConnectTransfer,
  sendTonConnectTransfer,
} from '@tonkeeper/core/dist/service/transfer/tonService';
import { AccountEvent } from '@tonkeeper/core/dist/tonApiV1';
import React, { FC, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useFormatCoinValue } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { getPasswordByNotification } from '../../pages/home/UnlockNotification';
import { CheckmarkCircleIcon } from '../Icon';
import { ListBlock } from '../List';
import { Notification, NotificationBlock } from '../Notification';
import { Label2 } from '../Text';
import { Button, ButtonRow } from '../fields/Button';
import { FeeListItem } from '../transfer/ConfirmListItem';
import { ResultButton } from '../transfer/common';
import { TonTransactionAction } from './TonTransactionAction';

const ButtonGap = styled.div`
  height: 56px;
`;

const ButtonRowFixed = styled(ButtonRow)`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 16px;
  padding: 0 16px;
  box-sizing: border-box;

  &:after {
    content: '';
    position: absolute;
    width: 100%;
    left: 0;
    bottom: -1rem;
    height: calc(100% + 1rem);
    z-index: -1;
    background: ${(props) => props.theme.gradientBackgroundBottom};
  }
`;

const useSendMutation = (params: TonConnectTransactionPayload) => {
  const wallet = useWalletContext();
  const sdk = useAppSdk();
  const { tonApi } = useAppContext();

  return useMutation<string, Error>(async () => {
    const auth = await sdk.storage.get<AuthState>(AppKey.password);
    if (!auth) {
      throw new Error('Missing Auth');
    }
    const password = await getPasswordByNotification(sdk, auth);
    await sendTonConnectTransfer(sdk.storage, tonApi, wallet, params, password);

    return 'ok';
  });
};

const ConnectContent: FC<{
  params: TonConnectTransactionPayload;
  accountEvent?: AccountEvent;
  handleClose: (result?: string) => void;
}> = ({ params, accountEvent, handleClose }) => {
  const [done, setDone] = useState(false);

  const { t } = useTranslation();

  const { mutateAsync, isLoading } = useSendMutation(params);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const result = await mutateAsync();
    setDone(true);
    setTimeout(() => handleClose(result), 300);
  };

  const format = useFormatCoinValue();
  const feeAmount = useMemo(
    () => (accountEvent ? format(accountEvent.fee.total) : undefined),
    [format, accountEvent]
  );

  return (
    <NotificationBlock onSubmit={onSubmit}>
      {feeAmount && (
        <ListBlock margin={false} fullWidth>
          <FeeListItem feeAmount={feeAmount} />
        </ListBlock>
      )}
      {(accountEvent?.actions ?? []).map((action, index) => (
        <TonTransactionAction key={index} action={action} />
      ))}
      <ButtonGap />
      <ButtonRowFixed>
        {done && (
          <ResultButton done>
            <CheckmarkCircleIcon />
            <Label2>{t('ton_login_success')}</Label2>
          </ResultButton>
        )}
        {!done && (
          <>
            <Button
              size="large"
              type="button"
              loading={isLoading}
              disabled={isLoading}
              onClick={() => handleClose()}
            >
              {t('cancel')}
            </Button>
            <Button
              size="large"
              type="submit"
              primary
              fullWidth
              loading={isLoading}
              disabled={isLoading}
            >
              {t('Confirm')}
            </Button>
          </>
        )}
      </ButtonRowFixed>
    </NotificationBlock>
  );
};

const useEstimation = (params: TonConnectTransactionPayload | null) => {
  const sdk = useAppSdk();
  const { t } = useTranslation();
  const { tonApi } = useAppContext();
  const wallet = useWalletContext();

  return useQuery<AccountEvent, Error>(
    [QueryKey.estimate, params],
    () => {
      sdk.uiEvents.emit('copy', {
        method: 'copy',
        params: t('loading'),
      });

      return estimateTonConnectTransfer(tonApi, wallet, params!);
    },
    {
      enabled: params != null,
    }
  );
};

export const TonTransactionNotification: FC<{
  params: TonConnectTransactionPayload | null;
  handleClose: (result?: string) => void;
}> = ({ params, handleClose }) => {
  const { t } = useTranslation();
  const { data: accountEvent, isLoading } = useEstimation(params);

  const Content = useCallback(() => {
    if (!params) return undefined;
    return (
      <ConnectContent
        params={params}
        accountEvent={accountEvent}
        handleClose={handleClose}
      />
    );
  }, [origin, params, accountEvent, handleClose]);

  return (
    <Notification
      isOpen={!isLoading && params != null}
      handleClose={() => handleClose()}
      title={t('txActions_signRaw_title')}
      hideButton
    >
      {Content}
    </Notification>
  );
};
