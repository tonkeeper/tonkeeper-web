import { AccountRepr } from '@tonkeeper/core/dist/tonApiV1';
import { toShortAddress } from '@tonkeeper/core/dist/utils/common';
import React, { FC, PropsWithChildren, useEffect, useState } from 'react';
import styled from 'styled-components';
import useTextWidth from '../../hooks/textWidth';
import { Body1 } from '../Text';

interface ShowAddressProps {
  inputTextWidth: number;
  addressTextWidth: number;
  value: string;
}
export const useShowAddress = (
  ref: React.MutableRefObject<HTMLInputElement | null>,
  value: string,
  toAccount?: AccountRepr
) => {
  const address = toAccount?.address?.bounceable ?? undefined;

  const [showAddress, setShowAddress] = useState<ShowAddressProps | undefined>(
    undefined
  );

  console.log(showAddress);

  const inputTextWidth = useTextWidth({
    text: value,
    font: '16px sans-serif',
  });
  const addressTextWidth = useTextWidth({
    text: address ? toShortAddress(address) : undefined,
    font: '16px sans-serif',
  });

  useEffect(() => {
    if (
      ref.current &&
      toAccount &&
      !isNaN(inputTextWidth) &&
      !isNaN(addressTextWidth) &&
      ref.current.clientWidth - 16 * 3 - inputTextWidth - addressTextWidth > 0
    ) {
      setShowAddress({
        inputTextWidth,
        addressTextWidth,
        value: toShortAddress(toAccount.address.bounceable),
      });
    } else {
      setShowAddress(undefined);
    }
  }, [ref.current, toAccount, inputTextWidth, addressTextWidth]);

  return showAddress;
};

const ShowAddressBlock = styled.div`
  position: relative;
  width: 100%;
`;

const ShowAddressLabel = styled(Body1)<{ inputTextWidth: number }>`
  position: absolute;
  bottom: 0;
  line-height: 48px;
  left: ${(props) => Math.ceil(props.inputTextWidth) + 36}px;
  color: ${(props) => props.theme.textSecondary};
  user-select: none;
`;

export const ShowAddress: FC<
  PropsWithChildren<{ value?: ShowAddressProps }>
> = ({ value, children }) => {
  return (
    <ShowAddressBlock>
      {children}
      {value && (
        <ShowAddressLabel inputTextWidth={value.inputTextWidth}>
          {value.value}
        </ShowAddressLabel>
      )}
    </ShowAddressBlock>
  );
};
