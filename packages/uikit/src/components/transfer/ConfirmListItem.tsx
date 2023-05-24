import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { RecipientData } from '@tonkeeper/core/dist/entries/send';
import { toShortAddress } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import { Address } from 'ton-core';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { ColumnText } from '../Layout';
import { ListItem, ListItemPayload } from '../List';
import { Label1 } from '../Text';
import { Label } from './common';

const RecipientItem: FC<{ name: string; label: string }> = ({
  name,
  label,
}) => {
  const { t } = useTranslation();
  const sdk = useAppSdk();

  return (
    <ListItem onClick={() => sdk.copyToClipboard(name)}>
      <ListItemPayload>
        <Label>{t('txActions_signRaw_recipient')}</Label>
        <Label1>{label}</Label1>
      </ListItemPayload>
    </ListItem>
  );
};

const RecipientItemAddress: FC<{ address: string }> = ({ address }) => {
  const { t } = useTranslation();
  const sdk = useAppSdk();

  return (
    <ListItem onClick={() => sdk.copyToClipboard(address, t('address_copied'))}>
      <ListItemPayload>
        <Label>{t('transaction_recipient_address')}</Label>
        <Label1>{toShortAddress(address)}</Label1>
      </ListItemPayload>
    </ListItem>
  );
};

export const RecipientListItem: FC<{ recipient: RecipientData }> = ({
  recipient,
}) => {
  const { address } = recipient;
  if ('isFavorite' in address && address.isFavorite) {
    return (
      <>
        <RecipientItem
          name={Address.parse(address.address).toString()}
          label={address.name}
        />
        <RecipientItemAddress
          address={recipient.toAccount.address.bounceable}
        />
      </>
    );
  }
  if ('dns' in recipient.address) {
    return (
      <>
        <RecipientItem
          name={recipient.address.address}
          label={recipient.address.address}
        />
        <RecipientItemAddress
          address={recipient.toAccount.address.bounceable}
        />
      </>
    );
  }

  const { name } = recipient.toAccount;
  if (name) {
    return (
      <>
        <RecipientItem name={name} label={name} />
        <RecipientItemAddress
          address={recipient.toAccount.address.bounceable}
        />
      </>
    );
  }

  return (
    <RecipientItem
      name={recipient.toAccount.address.bounceable}
      label={toShortAddress(recipient.toAccount.address.bounceable)}
    />
  );
};

export const AmountListItem: FC<{
  coinAmount: string;
  fiatAmount?: string;
}> = ({ coinAmount, fiatAmount }) => {
  const { t } = useTranslation();

  return (
    <ListItem hover={false}>
      <ListItemPayload>
        <Label>{t('txActions_amount')}</Label>
        {fiatAmount ? (
          <ColumnText
            right
            text={coinAmount}
            secondary={<>≈&thinsp;{fiatAmount}</>}
          />
        ) : (
          <Label1>{coinAmount}</Label1>
        )}
      </ListItemPayload>
    </ListItem>
  );
};

export const FeeListItem: FC<{ feeAmount: string; fiatFeeAmount?: string }> = ({
  feeAmount,
  fiatFeeAmount,
}) => {
  const { t } = useTranslation();
  return (
    <ListItem hover={false}>
      <ListItemPayload>
        <Label>{t('txActions_fee')}</Label>
        {fiatFeeAmount ? (
          <ColumnText
            right
            text={
              <>
                {feeAmount} {CryptoCurrency.TON}
              </>
            }
            secondary={<>≈&thinsp;{fiatFeeAmount}</>}
          />
        ) : (
          <Label1>
            {feeAmount} {CryptoCurrency.TON}
          </Label1>
        )}
      </ListItemPayload>
    </ListItem>
  );
};
