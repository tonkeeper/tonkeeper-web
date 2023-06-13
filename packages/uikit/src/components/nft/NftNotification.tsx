import React, {FC, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import styled from 'styled-components';
import { useFBAnalyticsEvent } from '../../hooks/analytics';
import { useTranslation } from '../../hooks/translation';
import {expiringNFTDaysPeriod, useNftCollectionData, useWalletJettonList, useWalletNftList} from '../../state/wallet';
import { BackButton, ButtonMock } from '../fields/BackButton';
import { ChevronDownIcon, VerificationIcon } from '../Icon';
import { Body, CroppedBodyText } from '../jettons/CroppedText';
import {
  Notification,
  NotificationBlock,
  NotificationTitleBlock,
} from '../Notification';
import {Body2, H2, H3, Label1, Label4} from '../Text';
import { NftAction } from './NftAction';
import { NftDetails } from './NftDetails';
import { Image, NftBlock } from './Nfts';
import {Button} from "../fields/Button";
import {isNFTDNS, NFT, NFTDNS} from "@tonkeeper/core/dist/entries/nft";
import {useDateFormat} from "../../hooks/dateFormat";
import {ConfirmView} from "../transfer/ConfirmView";
import {useGetToAccount} from "../transfer/RecipientView";
import {AmountValue, RecipientData} from "@tonkeeper/core/dist/entries/send";
import {useAppSdk} from "../../hooks/appSdk";
import {useAppContext, useWalletContext} from "../../hooks/appContext";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {CryptoCurrency} from "@tonkeeper/core/dist/entries/crypto";
import {estimateTonTransfer} from "@tonkeeper/core/dist/service/transfer/tonService";
import {childFactoryCreator, duration, notifyError, Wrapper} from "../transfer/common";
import BigNumber from "bignumber.js";
import {useUserJettonList} from "../../state/jetton";
import {AccountsApi} from "@tonkeeper/core/dist/tonApiV2";

const Text = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.875rem 1rem;
`;

const Delimiter = styled.div`
  border-top: 1px solid ${(props) => props.theme.separatorCommon};
`;

const DelimiterExtra = styled.div`
  margin: 0 -1rem;
  width: calc(100% + 2rem);
  border-top: 1px solid ${(props) => props.theme.separatorCommon};
`;

const CollectionTitle = styled(Label1)`
  margin-bottom: 0.5rem;
`;

const Icon = styled.span`
  position: relative;
  top: 3px;
  margin-left: 4px;
`;

const RenewDNSBlock = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const RenewDNSButton = styled(Button)`
  margin-bottom: 0.75rem;
`

const RenewDNSValidUntil = styled(Body2)`
  color: ${props => props.theme.textSecondary}
`

const TonDnsRoot =
  '0:b774d95eb20543f186c06b371ab88ad704f7e256130caf96189368a7d0cb6ccf';

const Title = styled(H2)`
  word-break: break-word;

  user-select: none;
`;

const SaleBlock = styled(Label4)`
  color: ${(props) => props.theme.textSecondary};
  border: 1px solid ${(props) => props.theme.buttonTertiaryBackground};
  border-radius: 6px;
  padding: 3.5px 6px 4.5px;
  text-transform: uppercase;

  position: relative;
  top: -3px;

  white-space: nowrap;
`;

const useEstimateTonTransfer = () => {
  const { t } = useTranslation();
  const sdk = useAppSdk();
  const { tonApi } = useAppContext();
  const wallet = useWalletContext();
  const client = useQueryClient();

  return useMutation(async ( options: { recipient:RecipientData, amount: AmountValue }) => {
    try {
        return await estimateTonTransfer(tonApi, wallet, options.recipient, options.amount);
    } catch (e) {
      await notifyError(client, sdk, t, e);
      throw e;
    }
  });
};

const useDNSNFTRefresh = (nft: NFTDNS) => {
  const { tonApiV2 } = useAppContext();
  const timeout = 1000 * 60 * 2;
  const waitForDomainRenewed = async (startTimestamp?: number): Promise<boolean> => {
    const response = await new AccountsApi(tonApiV2).getDnsExpiring({
      accountId: nft.owner!.address,
      period: expiringNFTDaysPeriod
    });
    const dns = response.items.find(item => item.name === nft.dns);

    if (!dns || !dns?.expiringAt) {
      return true;
    }

    startTimestamp ||= Date.now();
    if (Date.now() - startTimestamp < timeout) {
        return waitForDomainRenewed(startTimestamp);
    }

    return false;
  }

  return useQuery({
    queryKey: ['nft-dns-renewing_' + nft.dns],
    queryFn: () => waitForDomainRenewed(),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    enabled: false
  });
}


const dNSRenewAmount = new BigNumber(0.01);
export const RenewNft: FC<{
  nftItem: NFTDNS;
}> = ({ nftItem }) => {
  const { t } = useTranslation();
  const { refetch: refetchAllNFT } = useWalletNftList();
  const { data: dnsRenewed, isFetching: dnsRenewedLoading, refetch: refetchDnsRenewed } = useDNSNFTRefresh(nftItem);
  const [isOpen, setIsOpen] = useState(false);

  const onClose = useCallback((confirmed?: boolean) => {
    setIsOpen(false);

    if (confirmed) {
      refetchDnsRenewed();
    }
  }, [refetchDnsRenewed]);
  const expiresAtFormatted = useDateFormat(nftItem.expiresAt);

  const { data: jettons } = useWalletJettonList();
  const filter = useUserJettonList(jettons);

  const { isLoading: isRecipientLoading, data, mutate: mutateRecipient } =
      useGetToAccount();

  const { isLoading: isFeeLoading, data: fee, mutate: mutateFee } = useEstimateTonTransfer();

  useEffect(() => {
    mutateRecipient({ address: nftItem.address });
  }, [nftItem.address]);

  const recipient = useMemo(() => ({
    address: { address: nftItem.address },
    comment: '',
    done: false,
    toAccount: data!
  }), [data]);

  useEffect(() => {
    if (recipient.toAccount) {
      mutateFee({ recipient, amount: {amount: dNSRenewAmount, max: false} });
    }
  }, [recipient]);

  const amount = useMemo(() => ({
    jetton: CryptoCurrency.TON,
    done: false,
    amount: dNSRenewAmount,
    fee: fee!,
    max: false
  }), [fee])

  useEffect(() => {
    if (dnsRenewed) {
      refetchAllNFT();
    }
  }, [dnsRenewed, refetchAllNFT]);

  const child = useCallback(() => <ConfirmView
      onClose={onClose}
      recipient={recipient}
      amount={amount}
      jettons={filter}
  />, [recipient, amount, filter]);

  return <>
    <RenewDNSBlock>
      <RenewDNSButton type="button" disabled={dnsRenewedLoading || dnsRenewed} loading={!dnsRenewedLoading && (isFeeLoading || isRecipientLoading)} onClick={() => setIsOpen(true)} size="large" secondary fullWidth>
        {dnsRenewedLoading ? t('renew_nft_in_progress') :  dnsRenewed ? t('renew_nft_renewed') : t('renew_nft', { value: dNSRenewAmount.toString() })}
      </RenewDNSButton>
      {!dnsRenewed && <RenewDNSValidUntil>{t('renew_nft_expiration_date', { value: expiresAtFormatted })}</RenewDNSValidUntil>}
    </RenewDNSBlock>
    <Notification isOpen={isOpen} hideButton
                  handleClose={() => onClose}
                  backShadow>
      {child}
    </Notification>
  </>
};

const NftPreview: FC<{
  onClose: () => void;
  nftItem: NFT;
}> = ({ onClose, nftItem }) => {
  const ref = useRef<HTMLImageElement | null>(null);
  const { t } = useTranslation();
  const { data: collection } = useNftCollectionData(nftItem);

  useFBAnalyticsEvent('screen_view');

  const { description } = nftItem.metadata;
  const name = nftItem.dns ?? nftItem.metadata.name;

  const itemKind = useMemo(() => {
    if (nftItem.collection?.address == TonDnsRoot) {
      return 'ton.dns';
    } else {
      return 'token';
    }
  }, [nftItem]);

  const collectionName = nftItem?.collection?.name;

  const image = nftItem.previews?.find(
    (item) => item.resolution === '1500x1500'
  );

  return (
    <NotificationBlock>
      <NotificationTitleBlock>
        <BackButton onClick={onClose}>
          <ChevronDownIcon />
        </BackButton>
        <H3>{nftItem.dns ?? nftItem.metadata.name}</H3>
        <ButtonMock />
      </NotificationTitleBlock>
      <NftBlock>
        {image && <Image ref={ref} url={image.url} />}
        <Text>
          <Title>
            {name}
            {nftItem.sale && (
              <>
                {'  '}
                <SaleBlock>{t('nft_on_sale')}</SaleBlock>
              </>
            )}
          </Title>
          {collectionName && (
            <Body open margin="small">
              {collectionName}
              {nftItem.approvedBy && nftItem.approvedBy.length > 0 && (
                <Icon>
                  <VerificationIcon />
                </Icon>
              )}
            </Body>
          )}
          {description && (
            <CroppedBodyText text={description} margin="last" contentColor />
          )}
        </Text>
        {collection && collection.metadata.description && (
          <>
            <Delimiter />
            <Text>
              <CollectionTitle>{t('About_collection')}</CollectionTitle>
              <CroppedBodyText
                text={collection.metadata.description}
                margin="last"
                contentColor
              />
            </Text>
          </>
        )}
      </NftBlock>

      {
          !!(isNFTDNS(nftItem) && nftItem.expiresAt) && <RenewNft nftItem={nftItem} />
      }

      <NftAction nftItem={nftItem} kind={itemKind} />
      <DelimiterExtra />

      <NftDetails nftItem={nftItem} kind={itemKind} />
    </NotificationBlock>
  );
};
export const NftNotification: FC<{
  nftItem: NFT | undefined;
  handleClose: () => void;
}> = ({ nftItem, handleClose }) => {
  const Content = useCallback(() => {
    if (!nftItem) return undefined;
    return <NftPreview onClose={handleClose} nftItem={nftItem} />;
  }, [nftItem, handleClose]);

  return (
    <Notification
      isOpen={nftItem != undefined}
      hideButton
      handleClose={handleClose}
      backShadow
    >
      {Content}
    </Notification>
  );
};
