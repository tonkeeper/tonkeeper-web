import { useQuery } from '@tanstack/react-query';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { NFTDNS } from '@tonkeeper/core/dist/entries/nft';
import { AccountsApi } from '@tonkeeper/core/dist/tonApiV2';
import { unShiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import BigNumber from 'bignumber.js';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useEstimateNftRenew } from '../../hooks/blockchain/nft/useEstimateNftRenew';
import { useRenewNft } from '../../hooks/blockchain/nft/useRenewNft';
import { useRecipient } from '../../hooks/blockchain/useRecipient';
import {toDaysLeft, useDateFormat,} from '../../hooks/dateFormat';
import { useTranslation } from '../../hooks/translation';
import { useNotification } from '../../hooks/useNotification';
import { useUserJettonList } from '../../state/jetton';
import {
  expiringNFTDaysPeriod, useNftDNSExpiringData,
  useWalletJettonList,
  useWalletNftList,
} from '../../state/wallet';
import { Notification } from '../Notification';
import { Body2 } from '../Text';
import { Button } from '../fields/Button';
import {
  ConfirmView,
  ConfirmViewButtons,
  ConfirmViewButtonsSlot,
} from '../transfer/ConfirmView';
import {useAreNftActionsDisabled} from "../../hooks/blockchain/nft/useAreNftActionsDisabled";
import {useQueryChangeWait} from "../../hooks/useQueryChangeWait";

const RenewDNSBlock = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const RenewDNSButton = styled(Button)`
  margin-bottom: 0.75rem;
`;

const RenewDNSValidUntil = styled(Body2)<{ danger: boolean }>`
  color: ${(props) => props.danger ? props.theme.accentRed : props.theme.textSecondary};
`;

const dnsRenewAmount = new BigNumber(0.02);
const YEAR_MS = 1000 * 60 * 60 * 24 * 365;
const intlOptions = { year: 'numeric', hour: undefined, minute: undefined} as const;

export const RenewNft: FC<{
  nft: NFTDNS;
}> = ({ nft }) => {
  const isDisabled = useAreNftActionsDisabled(nft);
  const notifyError = useNotification();
  const { t } = useTranslation();

  const query = useNftDNSExpiringData(nft);
  const { data: expirationInfo, isLoading: isExpirationInfoLoading } = query;

  const { refetch: refetchExpirationInfo, isLoading: isWaitingForUpdate } = useQueryChangeWait(
        query,
        (current, prev) => {
            return !!current?.expiringAt && current.expiringAt !== prev?.expiringAt
        }
  );

  const renewUntilFormatted = useDateFormat(Date.now() + YEAR_MS, intlOptions);

  const [isOpen, setIsOpen] = useState(false);
  const onClose = (confirmed?: boolean) => {
      setIsOpen(false);

      if (confirmed) {
          refetchExpirationInfo();
      }
  }

  const { data: jettons } = useWalletJettonList();
  const filter = useUserJettonList(jettons);

  const { recipient, isLoading: isRecipientLoading } = useRecipient(
    nft.address
  );

  const {
    isLoading: isFeeLoading,
    data: fee,
    mutate: calculateFee,
    error,
  } = useEstimateNftRenew();
  useEffect(() => {
    calculateFee({
      nftAddress: nft.address,
      amount: unShiftedDecimals(dnsRenewAmount),
    });
  }, [nft.address]);
  const amount = useMemo(
    () => ({
      jetton: CryptoCurrency.TON,
      done: false,
      amount: dnsRenewAmount,
      fee: fee!,
      max: false,
    }),
    [fee]
  );

  const { mutateAsync: renewMutateAsync, ...renewNftMutation } = useRenewNft();

  const onOpen = () => {
    if (error) {
      notifyError(error as Error);
      return;
    }
    setIsOpen(true);
  };

  if (!isExpirationInfoLoading && !expirationInfo?.expiringAt) {
      return null;
  }

  const child = () =>
      <ConfirmView
        onClose={onClose}
        recipient={recipient}
        amount={amount}
        jettons={filter}
        mutateAsync={() =>
          renewMutateAsync({
            nftAddress: nft.address,
            fee: fee!,
            amount: unShiftedDecimals(dnsRenewAmount),
          })
        }
        {...renewNftMutation}
      >
        <ConfirmViewButtonsSlot>
          <ConfirmViewButtons withCancelButton />
        </ConfirmViewButtonsSlot>
      </ConfirmView>

  const daysLeft = toDaysLeft(expirationInfo?.expiringAt ? expirationInfo?.expiringAt * 1000 : undefined);

  return (
    <>
      <RenewDNSBlock>
        <RenewDNSButton
          type="button"
          disabled={isDisabled || isWaitingForUpdate}
          loading={isExpirationInfoLoading || isFeeLoading || isRecipientLoading}
          onClick={onOpen}
          size="large"
          secondary
          fullWidth
        >
          {isWaitingForUpdate
            ? t('renew_nft_in_progress')
            : t('renew_nft').replace('%1%', renewUntilFormatted )}
        </RenewDNSButton>

        {daysLeft !== '' &&
        <RenewDNSValidUntil danger={Number(daysLeft) <= 30}>
            {t('renew_nft_expiration_date').replace('%1%', daysLeft)}
        </RenewDNSValidUntil>
        }
      </RenewDNSBlock>
      <Notification
        isOpen={isOpen}
        hideButton
        handleClose={() => onClose}
        backShadow
      >
        {child}
      </Notification>
    </>
  );
};