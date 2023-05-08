import { useQuery } from '@tanstack/react-query';
import { RecipientData } from '@tonkeeper/core/dist/entries/send';
import {
  parseTonTransfer,
  TonTransferParams,
} from '@tonkeeper/core/dist/service/deeplinkingService';
import { seeIfBalanceError } from '@tonkeeper/core/dist/service/transfer/common';
import { estimateNftTransfer } from '@tonkeeper/core/dist/service/transfer/nftService';
import { NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import React, { FC, useCallback, useRef, useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { Notification } from '../Notification';
import { childFactoryCreator, duration, Wrapper } from './common';
import { ConfirmNftView } from './ConfirmNftView';
import { RecipientView, useGetToAccount } from './RecipientView';

const useNftTransferEstimation = (
  nftItem: NftItemRepr,
  data?: RecipientData
) => {
  const { t } = useTranslation();
  const sdk = useAppSdk();
  const { tonApi } = useAppContext();
  const wallet = useWalletContext();

  return useQuery(
    [QueryKey.estimate, data?.toAccount.address],
    () => {
      try {
        return estimateNftTransfer(tonApi, wallet, data!, nftItem);
      } catch (e) {
        if (seeIfBalanceError(e)) {
          sdk.uiEvents.emit('copy', {
            method: 'copy',
            params: t('send_screen_steps_amount_insufficient_balance'),
          });
        }

        throw e;
      }
    },
    { enabled: data != null }
  );
};

const SendContent: FC<{ nftItem: NftItemRepr; onClose: () => void }> = ({
  nftItem,
  onClose,
}) => {
  const sdk = useAppSdk();
  const { t } = useTranslation();
  const { standalone } = useAppContext();
  const recipientRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);

  const [right, setRight] = useState(true);
  const [recipient, setRecipient] = useState<RecipientData | undefined>(
    undefined
  );

  const { mutateAsync: getAccountAsync, isLoading: isAccountLoading } =
    useGetToAccount();
  const { data: fee } = useNftTransferEstimation(nftItem, recipient);

  const onRecipient = (data: RecipientData) => {
    setRight(true);
    setRecipient(data);
  };

  const backToRecipient = useCallback(() => {
    setRight(false);
    setRecipient((value) => (value ? { ...value, done: false } : undefined));
  }, [setRecipient]);

  const [state, nodeRef] = (() => {
    if (!recipient || !recipient.done) {
      return ['recipient', recipientRef] as const;
    }
    return ['confirm', confirmRef] as const;
  })();

  const processRecipient = useCallback(
    async ({ address }: TonTransferParams) => {
      const item = { address: address };
      const toAccount = await getAccountAsync(item);

      setRecipient({
        address: item,
        toAccount,
        comment: '',
        done: true,
      });
    },
    [setRecipient, getAccountAsync]
  );

  const onScan = async (signature: string) => {
    const param = parseTonTransfer({ url: signature });
    if (param === null) {
      return sdk.uiEvents.emit('copy', {
        method: 'copy',
        params: t('Unexpected_QR_Code'),
      });
    } else {
      await processRecipient(param);
    }
  };

  return (
    <Wrapper standalone={standalone}>
      <TransitionGroup childFactory={childFactoryCreator(right)}>
        <CSSTransition
          key={state}
          nodeRef={nodeRef}
          classNames="right-to-left"
          addEndListener={(done) => {
            setTimeout(done, duration);
          }}
        >
          <div ref={nodeRef}>
            {state === 'recipient' && (
              <RecipientView
                title={t('nft_transfer_title')}
                data={recipient}
                onClose={onClose}
                setRecipient={onRecipient}
                onScan={onScan}
              />
            )}
            {state === 'confirm' && (
              <ConfirmNftView
                onClose={onClose}
                onBack={backToRecipient}
                recipient={recipient!}
                fee={fee}
                nftItem={nftItem}
              />
            )}
          </div>
        </CSSTransition>
      </TransitionGroup>
    </Wrapper>
  );
};

export const SendNftAction: FC<{
  nftItem?: NftItemRepr;
  onClose: () => void;
}> = ({ nftItem, onClose }) => {
  const Content = useCallback(() => {
    if (!nftItem) return undefined;
    return <SendContent onClose={onClose} nftItem={nftItem} />;
  }, [nftItem, onClose]);

  return (
    <Notification
      isOpen={nftItem != undefined}
      handleClose={onClose}
      hideButton
      backShadow
    >
      {Content}
    </Notification>
  );
};
