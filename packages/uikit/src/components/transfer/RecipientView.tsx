import { Suggestion } from '@tonkeeper/core/dist/entries/suggestion';
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { Address } from 'ton-core';
import { useTranslation } from '../../hooks/translation';
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

type Recipient = Suggestion | { address: string };

export interface RecipientData {
  address: Recipient;
  comment: string;
  done: boolean;
}

const ButtonBlock = styled.div`
  position: fixed;
  bottom: 1rem;
  width: 500px;
`;

const Label = styled(Label1)`
  width: 100%;
  margin-top: 12px;
  margin-bottom: -4px;
`;

export const RecipientView: FC<{
  data?: RecipientData;
  onClose: () => void;
  setRecipient: (options: RecipientData) => void;
}> = ({ data, onClose, setRecipient }) => {
  const { t } = useTranslation();

  const ref = useRef<HTMLInputElement | null>(null);

  const [recipient, setAddress] = useState<Recipient>(
    data?.address ?? {
      address: '',
    }
  );
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

  const isValid = useMemo(() => {
    try {
      const result = Address.parse(recipient.address);
      return true;
    } catch (e) {
      return false;
    }
  }, [recipient]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isValid) {
      setRecipient({ address: recipient, comment, done: true });
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

      <ButtonBlock>
        <Button
          fullWidth
          size="large"
          primary
          type="submit"
          disabled={!isValid}
        >
          {t('continue')}
        </Button>
      </ButtonBlock>
    </FullHeightBlock>
  );
};
