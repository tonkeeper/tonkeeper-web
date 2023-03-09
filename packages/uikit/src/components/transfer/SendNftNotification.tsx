import { RecipientData } from '@tonkeeper/core/dist/entries/send';
import { NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useWalletAccountInfo } from '../../state/wallet';
import { Notification } from '../Notification';
import { childFactoryCreator, duration, Wrapper } from './common';
import { ConfirmNftView } from './ConfirmNftView';
import { RecipientView } from './RecipientView';

const SendContent: FC<{ nftItem: NftItemRepr; onClose: () => void }> = ({
  nftItem,
  onClose,
}) => {
  const { data: info } = useWalletAccountInfo();
  const recipientRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);

  const [width, setWidth] = useState(0);

  const [right, setRight] = useState(true);
  const [recipient, setRecipient] = useState<RecipientData | undefined>(
    undefined
  );

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

  useEffect(() => {
    if (nodeRef.current) {
      setWidth(nodeRef.current.clientWidth);
    }
  }, [nodeRef.current]);

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
                data={recipient}
                onClose={onClose}
                setRecipient={onRecipient}
                width={width}
              />
            )}
            {state === 'confirm' && (
              <ConfirmNftView
                onClose={onClose}
                onBack={backToRecipient}
                recipient={recipient!}
                nftItem={nftItem}
                width={width}
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
    >
      {Content}
    </Notification>
  );
};
