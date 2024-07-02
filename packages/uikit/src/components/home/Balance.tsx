import { useQueryClient } from '@tanstack/react-query';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { FC, useEffect } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { formatFiatCurrency } from '../../hooks/balance';
import { QueryKey } from '../../libs/queryKey';
import { useActiveWallet, useWalletTotalBalance } from '../../state/wallet';
import { Body3, Label2, Num2 } from '../Text';
import { Badge } from '../shared';
import { SkeletonText } from '../shared/Skeleton';
import { AssetData } from './Jettons';
import { isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';

const Block = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: 32px;
`;

const Body = styled(Label2)`
    color: ${props => props.theme.textSecondary};
    user-select: none;
    display: flex;
`;

const Amount = styled(Num2)`
    margin-bottom: 0.5rem;
    user-select: none;
`;

const Error = styled.div`
    height: 26px;
    text-align: center;
    width: 100%;
`;

const Text = styled(Body3)`
    line-height: 26px;
    color: ${props => props.theme.textSecondary};
`;
const MessageBlock: FC<{ error?: Error | null; isFetching: boolean }> = ({ error }) => {
    if (error) {
        return (
            <Error>
                <Text>{error.message}</Text>
            </Error>
        );
    }

    return <Error></Error>;
};

export const BalanceSkeleton = () => {
    return (
        <Block>
            <Error></Error>
            <Amount>
                <SkeletonText size="large" width="120px" />
            </Amount>
            <Body>
                <SkeletonText size="small" width="60px" />
            </Body>
        </Block>
    );
};

const Label = () => {
    const wallet = useActiveWallet();

    if (!isStandardTonWallet(wallet)) {
        return <></>;
    }

    switch (wallet.auth.kind) {
        case 'signer':
        case 'signer-deeplink':
            return (
                <>
                    {' '}
                    <Badge display="inline-block" color="accentPurple">
                        Signer
                    </Badge>
                </>
            );
        case 'ledger':
            return (
                <>
                    {' '}
                    <Badge display="inline-block" color="accentGreen">
                        Ledger
                    </Badge>
                </>
            );
        case 'keystone':
            return (
                <>
                    {' '}
                    <Badge display="inline-block" color="accentGreen">
                        Keystone
                    </Badge>
                </>
            );
        default:
            return <></>;
    }
};

export const Balance: FC<{
    error?: Error | null;
    isFetching: boolean;
    assets: AssetData;
}> = ({ error, isFetching }) => {
    const sdk = useAppSdk();
    const { fiat } = useAppContext();
    const wallet = useActiveWallet();
    const client = useQueryClient();

    const address = formatAddress(wallet.rawAddress, wallet.network);

    const { data: total } = useWalletTotalBalance(fiat);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!total || total.toString() === '0') {
                client.invalidateQueries([QueryKey.total]);
            }
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [total]);

    return (
        <Block>
            <MessageBlock error={error} isFetching={isFetching} />
            <Amount>{formatFiatCurrency(fiat, total || 0)}</Amount>
            <Body onClick={() => sdk.copyToClipboard(address)}>
                {toShortValue(address)}
                <Label />
            </Body>
        </Block>
    );
};
