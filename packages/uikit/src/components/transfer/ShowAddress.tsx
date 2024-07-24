import { Account } from '@tonkeeper/core/dist/tonApiV2';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC, PropsWithChildren, useEffect, useState } from 'react';
import styled from 'styled-components';
import useTextWidth from '../../hooks/textWidth';
import { Body1 } from '../Text';
import { useActiveTonNetwork, useActiveWallet } from '../../state/wallet';

interface ShowAddressProps {
    inputTextWidth: number;
    addressTextWidth: number;
    value: string;
}
export const useShowAddress = (
    ref: React.MutableRefObject<HTMLTextAreaElement | null>,
    value: string,
    toAccount?: Account
) => {
    const network = useActiveTonNetwork();
    const address = toAccount?.address ?? undefined;

    const [showAddress, setShowAddress] = useState<ShowAddressProps | undefined>(undefined);

    const inputTextWidth = useTextWidth({
        text: value,
        font: '16px sans-serif'
    });
    const addressTextWidth = useTextWidth({
        text: address ? toShortValue(address) : undefined,
        font: '16px sans-serif'
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
                value: toShortValue(formatAddress(toAccount.address, network))
            });
        } else {
            setShowAddress(undefined);
        }
    }, [ref.current, toAccount, inputTextWidth, addressTextWidth, network]);

    return showAddress;
};

const ShowAddressBlock = styled.div`
    position: relative;
    width: 100%;
`;

const ShowAddressLabel = styled(Body1)<{ inputTextWidth: number }>`
    position: absolute;
    bottom: 0;
    line-height: 46px;
    left: ${props => Math.ceil(props.inputTextWidth) + 46}px;
    color: ${props => props.theme.textSecondary};
    user-select: none;
`;

export const ShowAddress: FC<PropsWithChildren<{ value?: ShowAddressProps }>> = ({
    value,
    children
}) => {
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
