import { NFT, isNFTDNS } from '@tonkeeper/core/dist/entries/nft';
import { NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import React, { FC, useState } from 'react';
import styled from 'styled-components';
import { Address } from 'ton-core';
import { useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { Body2 } from '../Text';
import { Button } from '../fields/Button';
import { Action } from '../home/Actions';
import { GlobalIcon } from '../home/HomeIcons';
import { SendNftAction } from '../transfer/SendNftNotification';
import { LinkNft } from './LinkNft';
import { RenewNft } from './RenewNft';
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
  nftItem: NFT;
}> = ({ nftItem }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wallet = useWalletContext();

  return (
    <>
      <Button
        primary
        size="large"
        fullWidth
        disabled={
          nftItem.sale != undefined ||
          nftItem.owner?.address !== wallet.active.rawAddress
        }
        onClick={() => setOpen(true)}
      >
        {t('Transfer_token')}
      </Button>
      {nftItem.sale && <DNSSaleText>{t('nft_on_sale_text')}</DNSSaleText>}
      <SendNftAction
        nftItem={open ? nftItem : undefined}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

export type NFTKind = 'token' | 'telegram.name' | 'telegram.number' | 'ton.dns';

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
  nftItem: NFT;
}> = ({ kind, nftItem }) => {
  const { t } = useTranslation();
  const sdk = useAppSdk();

  switch (kind) {
    case 'token': {
      return (
        <>
          <ActionTransfer nftItem={nftItem} />
          <Button
            size="large"
            secondary
            fullWidth
            onClick={() => sdk.openPage(getMarketplaceUrl(nftItem))}
          >
            {t('View_on_market')}
          </Button>
        </>
      );
    }
    case 'ton.dns': {
      if (!isNFTDNS(nftItem)) return <></>;
      return (
        <>
          <ActionTransfer nftItem={nftItem} />
          <Button
            size="large"
            secondary
            fullWidth
            onClick={() =>
              sdk.openPage(`https://dns.ton.org/#${nftItem.dns?.slice(0, -4)}`)
            }
          >
            {t('View_on_market')}
          </Button>

            {isNFTDNS(nftItem) && <>
                <LinkNft nft={nftItem} />
                <RenewNft nft={nftItem} />
            </>}
        </>
      );
    }
    case 'telegram.number': {
      const numbers = nftItem.metadata.name.replace(/\s/g, '').slice(1);

      return (
        <>
          <ActionTransfer nftItem={nftItem} />
          <Button
            size="large"
            secondary
            fullWidth
            onClick={() =>
              sdk.openPage(`https://fragment.com/number/${numbers}`)
            }
          >
            {t('View_on_market')}
          </Button>
        </>
      );
    }
    case 'telegram.name': {
      if (!isNFTDNS(nftItem)) return <></>;
      return (
        <>
          <ActionTransfer nftItem={nftItem} />
          <Button
            size="large"
            secondary
            fullWidth
            onClick={() =>
              sdk.openPage(
                `https://fragment.com/username/${nftItem.dns?.slice(0, -5)}`
              )
            }
          >
            {t('View_on_market')}
          </Button>
          <LinkNft nft={nftItem} />
        </>
      );
    }
  }
};
