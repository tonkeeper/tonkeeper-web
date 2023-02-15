import { NftItemRepr } from '@tonkeeper/core/dist/tonApi';
import React, { FC, useCallback, useState } from 'react';
import styled from 'styled-components';
import { Address } from 'ton-core';
import { useTranslation } from '../../hooks/translation';
import { Button } from '../fields/Button';
import {
  Notification,
  NotificationBlock,
  NotificationTitle,
} from '../Notification';

const Input = styled.input`
  outline: none;
  border: none;

  width: 100%;
  line-height: 56px;
  border-radius: ${(props) => props.theme.cornerSmall};
  display: flex;
  padding: 0 1rem;
  box-sizing: border-box;

  font-weight: 500;
  font-size: 16px;

  color: ${(props) => props.theme.textPrimary};

  border: 1px solid ${(props) => props.theme.fieldBackground};
  background: ${(props) => props.theme.fieldBackground};

  &:focus {
    border: 1px solid ${(props) => props.theme.fieldActiveBorder};
    background: ${(props) => props.theme.fieldBackground};
  }
`;

const ButtonRow = styled.div`
  position: static;
  bottom: 0;
  width: 100%;
`;

const isValidAddress = (value: string): boolean => {
  try {
    Address.parse(value);
    return true;
  } catch (e) {
    return false;
  }
};

const NftTransferContent: FC<{
  nftItem: NftItemRepr;
}> = ({ nftItem }) => {
  const [transfer, setTransfer] = useState('');
  const { t } = useTranslation();

  const isValid = isValidAddress(transfer);

  return (
    <NotificationBlock>
      <NotificationTitle>{t('Transfer_NFT')}</NotificationTitle>
      <Input
        value={transfer}
        onChange={(e) => setTransfer(e.target.value)}
        placeholder={t('Address_or_name')}
      />
      <ButtonRow>
        <Button size="large" primary fullWidth disabled={!isValid}>
          {t('create_wallet_continue_button')}
        </Button>
      </ButtonRow>
    </NotificationBlock>
  );
};

export const NftTransferNotification: FC<{
  nftItem: NftItemRepr | undefined;
  handleClose: () => void;
}> = ({ nftItem, handleClose }) => {
  const Content = useCallback(
    (afterClose: (action: () => void) => void) => {
      if (nftItem == null) return;
      return <NftTransferContent nftItem={nftItem} />;
    },
    [nftItem, nftItem]
  );

  const isOpen = nftItem != null;

  return (
    <Notification isOpen={isOpen} handleClose={handleClose}>
      {Content}
    </Notification>
  );
};
