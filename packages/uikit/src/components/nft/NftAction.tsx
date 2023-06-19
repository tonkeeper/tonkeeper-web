import { NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import React, { FC, useState } from 'react';
import styled from 'styled-components';
import { Address } from 'ton-core';
import { useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { Body2 } from '../Text';
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
  const wallet = useWalletContext();

  return (
    <>
      <Action
        icon={<SendIcon />}
        title={t('Transfer_token')}
        disabled={
          nftItem.sale != undefined ||
          nftItem.owner?.address !== wallet.active.rawAddress
        }
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

const SaleText = styled(Body2)`
  width: 100%;
  color: ${(props) => props.theme.textSecondary};
`;

const DNSSaleText = styled(SaleText)`
  width: auto;
  padding: 0 1rem;
  text-align: center;
`;

export const NftAction: FC<{
  kind: NFTKind;
  nftItem: NftItemRepr;
}> = ({ kind, nftItem }) => {
  const { t } = useTranslation();
  const sdk = useAppSdk();

  switch (kind) {
    case 'token': {
      return (
        <>
          <Row>
            <ActionTransfer nftItem={nftItem} />
            <Action
              icon={<GlobalIcon />}
              title={t('View_on_market')}
              action={() => sdk.openPage(getMarketplaceUrl(nftItem))}
            />
          </Row>
          {nftItem.sale && <SaleText>{t('nft_on_sale_text')}</SaleText>}
        </>
      );
    }
    case 'ton.dns': {
      return (
        <>
          {nftItem.sale && <DNSSaleText>{t('nft_on_sale_text')}</DNSSaleText>}
          <Row>
            <ActionTransfer nftItem={nftItem} />
            <Action
              icon={<GlobalIcon />}
              title={t('View_on_market')}
              action={() =>
                sdk.openPage(
                  `https://dns.ton.org/#${nftItem.dns?.slice(0, -4)}`
                )
              }
            />
          </Row>
        </>
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
