import { useQuery } from '@tanstack/react-query';
import { RecipientData } from '@tonkeeper/core/dist/entries/send';
import { estimateNftTransfer } from '@tonkeeper/core/dist/service/transfer/nftService';
import { NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import React, { FC, useCallback, useRef, useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { Notification } from '../Notification';
import { childFactoryCreator, duration, Wrapper } from './common';
import { ConfirmNftView } from './ConfirmNftView';
import { RecipientView } from './RecipientView';

const useNftTransferEstimation = (
  nftItem: NftItemRepr,
  data?: RecipientData
) => {
  const { tonApi } = useAppContext();
  const wallet = useWalletContext();

  return useQuery(
    [QueryKey.estimate, data?.toAccount.address],
    () => {
      return estimateNftTransfer(tonApi, wallet, data!, nftItem);
    },
    { enabled: data != null }
  );
};

const SendContent: FC<{ nftItem: NftItemRepr; onClose: () => void }> = ({
  nftItem,
  onClose,
}) => {
  const { t } = useTranslation();
  const recipientRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);

  const [right, setRight] = useState(true);
  const [recipient, setRecipient] = useState<RecipientData | undefined>(
    undefined
  );

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

  return (
    <Wrapper>
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
                allowComment={false}
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
