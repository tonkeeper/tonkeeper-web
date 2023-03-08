import { useQuery } from '@tanstack/react-query';
import { Recipient, RecipientData } from '@tonkeeper/core/dist/entries/send';
import { AccountApi, AccountRepr } from '@tonkeeper/core/dist/tonApiV1';
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { Address } from 'ton-core';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { ButtonMock } from '../fields/BackButton';
import { Button } from '../fields/Button';
import { Input } from '../fields/Input';
import { Gap } from '../Layout';
import {
  FullHeightBlock,
  NotificationCancelButton,
  NotificationTitleBlock,
} from '../Notification';
import { H3, Label1 } from '../Text';
import { SuggestionList } from './SuggestionList';

const ButtonBlock = styled.div<{ width: number }>`
  position: fixed;
  bottom: 1rem;
  width: ${(props) => props.width}px;
`;

const Label = styled(Label1)`
  width: 100%;
  margin-top: 12px;
  margin-bottom: -4px;
`;

const useToAccount = (isValid: boolean, account: string) => {
  const { tonApi } = useAppContext();
  return useQuery<AccountRepr, Error>(
    [QueryKey.account, account],
    () => {
      return new AccountApi(tonApi).getAccountInfo({ account });
    },
    { enabled: isValid }
  );
};

export const RecipientView: FC<{
  data?: RecipientData;
  onClose: () => void;
  setRecipient: (options: RecipientData) => void;
  width: number;
}> = ({ data, onClose, setRecipient, width }) => {
  const { t } = useTranslation();

  const ref = useRef<HTMLInputElement | null>(null);

  const [recipient, setAddress] = useState<Recipient>(
    data?.address ?? {
      address: '',
    }
  );

  const isValid = useMemo(() => {
    try {
      const result = Address.parse(recipient.address);
      return true;
    } catch (e) {
      return false;
    }
  }, [recipient]);

  const {
    data: toAccount,
    isFetching,
    error,
  } = useToAccount(isValid, recipient.address);

  const [comment, setComment] = useState(data?.comment ?? '');

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [ref.current]);

  const formatted = useMemo(() => {
    if ('isFavorite' in recipient) {
      return Address.parse(recipient.address).toString();
    }
    return recipient.address;
  }, [recipient]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isValid && toAccount) {
      setRecipient({ address: recipient, toAccount, comment, done: true });
    }
  };

  return (
    <FullHeightBlock onSubmit={onSubmit}>
      <NotificationTitleBlock>
        <ButtonMock />
        <H3>{t('transaction_recipient')}</H3>
        <NotificationCancelButton handleClose={onClose} />
      </NotificationTitleBlock>

      <Input
        ref={ref}
        value={formatted}
        onChange={(address) => setAddress({ address })}
        label={t('transaction_recipient_address')}
        isValid={isValid || recipient.address.length == 0}
      />
      <Input
        value={comment}
        onChange={setComment}
        label={t('send_comment_label')}
      />

      <Label>{t('send_screen_steps_address_suggests_label')}</Label>

      <SuggestionList onSelect={setAddress} />

      <Gap />

      <ButtonBlock width={width}>
        <Button
          fullWidth
          size="large"
          primary
          type="submit"
          disabled={!isValid}
          loading={isFetching}
        >
          {t('continue')}
        </Button>
      </ButtonBlock>
    </FullHeightBlock>
  );
};
