import { NftItemRepr } from '@tonkeeper/core/dist/tonApi/models';
import React, { FC, useCallback } from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { Button, ButtonRow } from '../fields/Button';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { Notification } from '../Notification';
import { Body1, Label1 } from '../Text';

export const Label = styled(Body1)`
  user-select: none;
  color: ${(props) => props.theme.textSecondary};
`;

// const useEstimation = () => {
//   return useQuery([QueryKey.estimate], () => {});
// };

const TonDnsUnlink: FC<{ nftItem: NftItemRepr; handleClose: () => void }> = ({
  nftItem,
  handleClose,
}) => {
  const { t } = useTranslation();

  const isLoading = false;
  return (
    <>
      <ListBlock>
        <ListItem>
          <ListItemPayload>
            <Label>{t('transaction_fee')}</Label>
            <Label1>≈&thinsp;0 TON</Label1>
          </ListItemPayload>
        </ListItem>
      </ListBlock>

      <ButtonRow>
        <Button
          size="large"
          fullWidth
          onClick={handleClose}
          type="button"
          loading={isLoading}
        >
          {t('cancel')}
        </Button>
        <Button
          size="large"
          primary
          fullWidth
          type="submit"
          loading={isLoading}
        >
          {t('continue')}
        </Button>
      </ButtonRow>
    </>
  );
};

export const TonDnsUnlinkNotification: FC<{
  open: boolean;
  handleClose: () => void;
  nftItem: NftItemRepr;
}> = ({ open, handleClose, nftItem }) => {
  const { t } = useTranslation();

  const Content = useCallback(() => {
    if (!open) return;
    return <TonDnsUnlink nftItem={nftItem} handleClose={handleClose} />;
  }, [open, nftItem, handleClose]);

  return (
    <Notification
      isOpen={open}
      hideButton
      handleClose={handleClose}
      title={t('dns_unlink_title')}
    >
      {Content}
    </Notification>
  );
};
