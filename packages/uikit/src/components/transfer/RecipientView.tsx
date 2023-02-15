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
import { H3 } from '../Text';

export interface RecipientData {
  address: string;
  comment: string;
  done: boolean;
}

const ButtonBlock = styled.div`
  position: sticky;
  bottom: 1rem;
  width: 100%;
`;

export const RecipientView: FC<{
  data?: RecipientData;
  onClose: () => void;
  setRecipient: (options: RecipientData) => void;
}> = ({ data, onClose, setRecipient }) => {
  const { t } = useTranslation();

  const ref = useRef<HTMLInputElement | null>(null);

  const [address, setAddress] = useState(data?.address ?? '');
  const [comment, setComment] = useState(data?.comment ?? '');

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [ref.current]);

  const isValid = useMemo(() => {
    try {
      const result = Address.parse(address);
      return true;
    } catch (e) {
      return false;
    }
  }, [address]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.stopPropagation();
    if (isValid) {
      setRecipient({ address, comment, done: true });
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
        value={address}
        onChange={setAddress}
        label={t('transaction_recipient_address')}
        isValid={isValid || address.length == 0}
      />
      <Input
        value={comment}
        onChange={setComment}
        label={t('send_comment_label')}
      />

      <Gap />
      {isValid && (
        <ButtonBlock>
          <Button fullWidth size="large" primary type="submit">
            {t('continue')}
          </Button>
        </ButtonBlock>
      )}
    </FullHeightBlock>
  );
};
