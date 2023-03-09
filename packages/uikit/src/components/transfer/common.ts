import { JettonsBalances } from '@tonkeeper/core/dist/tonApiV1';
import { getFiatAmountValue, TONAsset } from '@tonkeeper/core/dist/utils/send';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { formatFiatCurrency } from '../../hooks/balance';
import { useTonenpointStock } from '../../state/tonendpoint';
import { Body1 } from '../Text';

export const duration = 300;
export const timingFunction = 'ease-in-out';

const rightToLeft = 'right-to-left';
const leftToTight = 'left-to-right';

export const Wrapper = styled.div`
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

export const ButtonBlock = styled.div<{ width: number }>`
  position: fixed;
  bottom: 1rem;
  width: ${(props) => props.width}px;
`;

export const ResultButton = styled.div<{ done?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  color: ${(props) =>
    props.done ? props.theme.accentGreen : props.theme.accentRed};
`;

export const Label = styled(Body1)`
  user-select: none;
  color: ${(props) => props.theme.textSecondary};
`;

export const childFactoryCreator =
  (right: boolean) => (child: React.ReactElement) =>
    React.cloneElement(child, {
      classNames: right ? rightToLeft : leftToTight,
      timeout: duration,
    });

export const useFaitTonAmount = (amount: string) => {
  const { fiat } = useAppContext();
  const { data: stock } = useTonenpointStock();

  return useMemo(() => {
    const fiatAmount = getFiatAmountValue(
      stock,
      { balances: [] },
      fiat,
      TONAsset,
      amount
    );
    if (fiatAmount === undefined) return undefined;
    return formatFiatCurrency(fiat, fiatAmount);
  }, [stock, fiat, amount]);
};

export const useFiatAmount = (
  jettons: JettonsBalances,
  jetton: string,
  amount: string
) => {
  const { fiat } = useAppContext();
  const { data: stock } = useTonenpointStock();

  return useMemo(() => {
    const fiatAmount = getFiatAmountValue(stock, jettons, fiat, jetton, amount);
    if (fiatAmount === undefined) return undefined;
    return formatFiatCurrency(fiat, fiatAmount);
  }, [stock, jettons, fiat, jetton, amount]);
};
