import { useMutation, useQuery } from '@tanstack/react-query';
import { Recipient, RecipientData } from '@tonkeeper/core/dist/entries/send';
import { Suggestion } from '@tonkeeper/core/dist/entries/suggestion';
import { AccountApi, AccountRepr, DNSApi } from '@tonkeeper/core/dist/tonApiV1';
import { debounce } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { Address } from 'ton-core';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
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
import { Body2, H3, Label1 } from '../Text';
import { ButtonBlock } from './common';
import { ShowAddress, useShowAddress } from './ShowAddress';
import { SuggestionList } from './SuggestionList';

const Label = styled(Label1)`
  user-select: none;
  width: 100%;
  margin-top: 12px;
  margin-bottom: -4px;
`;

const Warning = styled(Body2)`
  user-select: none;
  display: block;
  width: 100%;
  margin-top: -4px;
  color: ${(props) => props.theme.accentOrange};
`;

const seeIfValidAddress = (value: string): boolean => {
  try {
    const result = Address.parse(value);
    return true;
  } catch (e) {
    return false;
  }
};

const useGetToAccount = () => {
  const { tonApi } = useAppContext();
  return useMutation<AccountRepr, Error, Recipient>((recipient) => {
    const account =
      'dns' in recipient ? recipient.dns.address : recipient.address;
    return new AccountApi(tonApi).getAccountInfo({ account });
  });
};
const useToAccount = (isValid: boolean, recipient: Recipient) => {
  const { tonApi } = useAppContext();
  const account =
    'dns' in recipient ? recipient.dns.address : recipient.address;
  return useQuery<AccountRepr, Error>(
    [QueryKey.account, account],
    () => new AccountApi(tonApi).getAccountInfo({ account }),
    { enabled: isValid }
  );
};

const useDnsWallet = (value: string) => {
  const { tonApi } = useAppContext();

  const [name, setName] = useState('');

  const update = useMemo(() => {
    return debounce<[string]>((v) => setName(v.toLowerCase()), 400);
  }, [setName]);

  update(value);

  return useQuery(
    [QueryKey.dns, name],
    async () => {
      const result = await new DNSApi(tonApi).dnsResolve({ name });
      if (!result.wallet) {
        throw new Error('Missing wallet');
      }
      return result.wallet;
    },
    { enabled: name.length > 3 && !seeIfValidAddress(name) }
  );
};

export const RecipientView: FC<{
  title: string;
  data?: RecipientData;
  allowComment?: boolean;
  onClose: () => void;
  setRecipient: (options: RecipientData) => void;
}> = ({ title, data, onClose, setRecipient, allowComment = true }) => {
  const sdk = useAppSdk();
  const [submitted, setSubmit] = useState(false);
  const { t } = useTranslation();

  const ref = useRef<HTMLInputElement | null>(null);

  const { mutateAsync: getAccountAsync, isLoading: isAccountLoading } =
    useGetToAccount();

  const [comment, setComment] = useState(data?.comment ?? '');
  const [recipient, setAddress] = useState<Recipient>(
    data?.address ?? {
      address: '',
    }
  );

  const { data: dnsWallet, isFetching: isDnsFetching } = useDnsWallet(
    recipient.address
  );

  useEffect(() => {
    if (dnsWallet) {
      setAddress((recipient) => ({
        address: recipient.address,
        dns: dnsWallet,
      }));
    }
  }, [setAddress, dnsWallet]);

  const isValid = useMemo(() => {
    if ('dns' in recipient) {
      return true;
    }
    return seeIfValidAddress(recipient.address);
  }, [recipient]);

  const { data: toAccount, isFetching: isAccountFetching } = useToAccount(
    isValid,
    recipient
  );

  const isFetching = isAccountFetching || isAccountLoading;

  const isMemoValid = useMemo(() => {
    if (!toAccount) return true;
    if (toAccount.memoRequired) {
      return comment.length > 0;
    }
    return true;
  }, [toAccount, comment]);

  useEffect(() => {
    if (sdk.isIOs()) {
      return;
    }
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

  const showAddress = useShowAddress(ref, formatted, toAccount);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setSubmit(true);
    if (isValid && isMemoValid && toAccount) {
      setRecipient({ address: recipient, toAccount, comment, done: true });
    }
  };

  const onSelect = async (item: Suggestion) => {
    setAddress(item);
    const toAccount = await getAccountAsync(item);
    setRecipient({
      address: recipient,
      toAccount,
      comment,
      done: true,
    });
  };

  return (
    <FullHeightBlock onSubmit={onSubmit}>
      <NotificationTitleBlock>
        <ButtonMock />
        <H3>{title}</H3>
        <NotificationCancelButton handleClose={onClose} />
      </NotificationTitleBlock>
      <ShowAddress value={showAddress}>
        <Input
          ref={ref}
          value={formatted}
          onChange={(address) => setAddress({ address })}
          label={t('transaction_recipient_address')}
          isValid={!submitted || isDnsFetching || isValid}
        />
      </ShowAddress>

      {allowComment && (
        <Input
          value={comment}
          onChange={setComment}
          label={t('send_comment_label')}
          isValid={!submitted || isMemoValid}
        />
      )}
      {allowComment && toAccount && toAccount.memoRequired && (
        <Warning>
          {t('send_screen_steps_comfirm_comment_required_text')}
        </Warning>
      )}

      <Label>{t('send_screen_steps_address_suggests_label')}</Label>

      <SuggestionList onSelect={onSelect} />

      <Gap />

      <ButtonBlock>
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
