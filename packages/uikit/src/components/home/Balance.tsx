import { useQueryClient } from '@tanstack/react-query';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { FC, useEffect } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { formatFiatCurrency } from '../../hooks/balance';
import { QueryKey } from '../../libs/queryKey';
import { useActiveAccount, useActiveTonNetwork, useActiveWallet } from '../../state/wallet';
import { Body3, Label2, Num2 } from '../Text';
import { SkeletonText } from '../shared/Skeleton';
import { AssetData } from './Jettons';
import { useWalletTotalBalance } from '../../state/asset';
import { useTranslation } from '../../hooks/translation';
import { AccountAndWalletBadgesGroup } from '../account/AccountBadge';

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
    cursor: pointer;

    transition: transform 0.2s ease;
    &:active {
        transform: scale(0.97);
    }
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

const AccountAndWalletBadgesGroupStyled = styled(AccountAndWalletBadgesGroup)`
    display: inline-flex;
    margin-left: 3px;
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

export const Balance: FC<{
    error?: Error | null;
    isFetching: boolean;
    assets: AssetData;
}> = ({ error, isFetching }) => {
    const { t } = useTranslation();
    const account = useActiveAccount();
    const sdk = useAppSdk();
    const { fiat } = useAppContext();
    const wallet = useActiveWallet();
    const client = useQueryClient();
    const network = useActiveTonNetwork();

    const address = formatAddress(wallet.rawAddress, network);

    const { data: total } = useWalletTotalBalance();

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
            <Body onClick={() => sdk.copyToClipboard(address, t('address_copied'))}>
                {toShortValue(address)}
                <AccountAndWalletBadgesGroupStyled
                    account={account}
                    walletId={account.activeTonWallet.id}
                />
            </Body>
        </Block>
    );
};
