import { NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import React, { FC, useState } from 'react';
import styled from 'styled-components';
import { Address } from 'ton-core';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { Action, ActionsRow } from '../home/Actions';
import { GlobalIcon, SendIcon } from '../home/HomeIcons';
import { SendNftAction } from '../transfer/SendNftNotification';
import { TonDnsUnlinkNotification } from './TonDnsNotification';

const getMarketplaceUrl = (nftItem: NftItemRepr) => {
  const { marketplace } = nftItem.metadata;
  const address = Address.parse(nftItem.address).toString();

  switch (marketplace) {
    case 'getgems.io':
      return `https://getgems.io/nft/${address}`;
    // TODO: add more
    default:
      return `https://getgems.io/nft/${address}`;
  }
};

const ActionTransfer: FC<{
  nftItem: NftItemRepr;
}> = ({ nftItem }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Action
        icon={<SendIcon />}
        title={t('Transfer_token')}
        action={() => setOpen(true)}
      />
      <SendNftAction
        nftItem={open ? nftItem : undefined}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

export type NFTKind = 'token' | 'telegram.name' | 'telegram.number' | 'ton.dns';

const Row = styled(ActionsRow)`
  margin: 1rem 0 0.563rem;
`;

export const UnlinkAction: FC<{ nftItem: NftItemRepr }> = ({ nftItem }) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  return (
    <>
      <Action
        icon={<GlobalIcon />}
        title={t('nft_link_domain_button')}
        action={() => setOpen(true)}
      />
      <TonDnsUnlinkNotification
        nftItem={nftItem}
        open={open}
        handleClose={() => setOpen(false)}
      />
    </>
  );
};

export const NftAction: FC<{
  kind: NFTKind;
  nftItem: NftItemRepr;
}> = ({ kind, nftItem }) => {
  const { t } = useTranslation();
  const sdk = useAppSdk();

  switch (kind) {
    case 'token': {
      return (
        <Row>
          <ActionTransfer nftItem={nftItem} />
          <Action
            icon={<GlobalIcon />}
            title={t('View_on_market')}
            action={() => sdk.openPage(getMarketplaceUrl(nftItem))}
          />
        </Row>
      );
    }
    case 'ton.dns': {
      return (
        <Row>
          <ActionTransfer nftItem={nftItem} />
          <Action
            icon={<GlobalIcon />}
            title={t('View_on_market')}
            action={() =>
              sdk.openPage(`https://dns.ton.org/#${nftItem.dns?.slice(0, -4)}`)
            }
          />
          <UnlinkAction nftItem={nftItem} />
        </Row>
      );
    }
    case 'telegram.number': {
      return (
        <Row>
          <ActionTransfer nftItem={nftItem} />
          <Action
            icon={<GlobalIcon />}
            title={t('View_on_market')}
            action={() => null}
          />
        </Row>
      );
    }
    case 'telegram.name': {
      return (
        <Row>
          <ActionTransfer nftItem={nftItem} />
          <Action
            icon={<GlobalIcon />}
            title={t('View_on_market')}
            action={() => null}
          />
        </Row>
      );
    }
  }
};
