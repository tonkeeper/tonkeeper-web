import React, { FC, useCallback, useRef, useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useTranslation } from '../../hooks/translation';
import { Action } from '../home/Actions';
import { SendIcon } from '../home/HomeIcons';
import { Notification } from '../Notification';
import { AmountData, AmountView } from './AmountView';
import { ConfirmView } from './ConfirmView';
import { RecipientData, RecipientView } from './RecipientView';

import styled from 'styled-components';

const duration = 300;
const timingFunction = 'ease-in-out';

const rightToLeft = 'right-to-left';
const leftToTight = 'left-to-right';

const Wrapper = styled.div`
  position: relative;
  overflow: hidden;
  margin-bottom: -1rem;

  .${rightToLeft}-exit, .${leftToTight}-exit {
    position: absolute;
    inset: 0;
    transform: translateX(0);
    opacity: 1;
  }

  .${rightToLeft}-enter {
    transform: translateX(100%);
    opacity: 0;
  }
  .${rightToLeft}-enter-active {
    transform: translateX(0);
    opacity: 1;
    transition: transform ${duration}ms ${timingFunction},
      opacity ${duration / 2}ms ${timingFunction};
  }

  .${rightToLeft}-exit-active {
    transform: translateX(-100%);
    opacity: 0;
    transition: transform ${duration}ms ${timingFunction},
      opacity ${duration / 2}ms ${timingFunction};
  }

  .${leftToTight}-enter {
    transform: translateX(-100%);
    opacity: 0;
  }
  .${leftToTight}-enter-active {
    transform: translateX(0);
    opacity: 1;
    transition: transform ${duration}ms ${timingFunction},
      opacity ${duration / 2}ms ${timingFunction};
  }

  .${leftToTight}-exit-active {
    transform: translateX(100%);
    opacity: 0;
    transition: transform ${duration}ms ${timingFunction},
      opacity ${duration / 2}ms ${timingFunction};
  }
`;

const childFactoryCreator = (right: boolean) => (child: React.ReactElement) =>
  React.cloneElement(child, {
    classNames: right ? rightToLeft : leftToTight,
    timeout: duration,
  });

const SendContent: FC<{ onClose: () => void; asset?: string }> = ({
  onClose,
  asset = 'TON',
}) => {
  const recipientRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);

  const [right, setRight] = useState(true);
  const [recipient, setRecipient] = useState<RecipientData | undefined>(
    undefined
  );
  const [amount, setAmount] = useState<AmountData | undefined>(undefined);

  const onRecipient = (data: RecipientData) => {
    setRight(true);
    setRecipient(data);
  };

  const onAmount = (data: AmountData) => {
    setRight(true);
    setAmount(data);
  };

  const backToRecipient = useCallback(() => {
    setRight(false);
    setRecipient((value) => (value ? { ...value, done: false } : undefined));
  }, [setRecipient]);

  const backToAmount = useCallback(() => {
    setRight(false);
    setAmount((value) => (value ? { ...value, done: false } : undefined));
  }, [setAmount]);

  const state = (() => {
    if (!recipient || !recipient.done) {
      return 'recipient';
    }
    if (!amount || !amount.done) {
      return 'amount';
    }

    return 'confirm';
  })();

  const nodeRef =
    state === 'recipient'
      ? recipientRef
      : state === 'amount'
      ? amountRef
      : confirmRef;

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
              />
            )}
            {state === 'amount' && (
              <AmountView
                data={amount}
                onClose={onClose}
                onBack={backToRecipient}
                asset={asset}
                address={recipient!.address.address}
                setAmount={onAmount}
              />
            )}
            {state === 'confirm' && (
              <ConfirmView
                onClose={onClose}
                onBack={backToAmount}
                recipient={recipient!}
                amount={amount!}
              />
            )}
          </div>
        </CSSTransition>
      </TransitionGroup>
    </Wrapper>
  );
};

export const SendAction: FC<{ asset?: string }> = ({ asset }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const Content = useCallback(() => {
    if (!open) return undefined;
    return <SendContent onClose={() => setOpen(false)} asset={asset} />;
  }, [open, asset]);

  return (
    <>
      <Action
        icon={<SendIcon />}
        title={t('wallet_send')}
        action={() => setOpen(true)}
      />
      <Notification isOpen={open} handleClose={() => setOpen(false)} hideButton>
        {Content}
      </Notification>
    </>
  );
};
