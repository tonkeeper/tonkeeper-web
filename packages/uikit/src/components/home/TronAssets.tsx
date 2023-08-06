import { TronBalances, TronToken } from '@tonkeeper/core/dist/tronApi';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import React, { FC, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormatBalance } from '../../hooks/balance';
import { AppRoute } from '../../libs/routes';
import { useFormatFiat, useRate } from '../../state/rates';
import { ListItem } from '../List';
import { ListItemPayload, TokenLayout, TokenLogo } from './TokenLayout';

const TronAsset: FC<{
    token: TronToken;
    weiAmount: string;
}> = ({ token, weiAmount }) => {
    const navigate = useNavigate();

    const amount = useMemo(() => formatDecimals(weiAmount, token.decimals), [weiAmount, token]);
    const balance = useFormatBalance(amount, token.decimals);

    const { data } = useRate(token.symbol);
    const { fiatPrice, fiatAmount } = useFormatFiat(data, amount);

    return (
        <ListItem onClick={() => navigate(AppRoute.coins + '/tron/' + token.address)}>
            <ListItemPayload>
                <TokenLogo src={token.image} />
                <TokenLayout
                    name={token.name}
                    symbol={token.symbol}
                    balance={balance}
                    secondary={fiatPrice}
                    fiatAmount={fiatAmount}
                    label="TRC20"
                    rate={data}
                />
            </ListItemPayload>
        </ListItem>
    );
};

export const TronAssets: FC<{ tokens: TronBalances }> = React.memo(({ tokens }) => {
    return (
        <>
            {tokens.balances.map(({ token, weiAmount }) => (
                <TronAsset key={token.address} token={token} weiAmount={weiAmount} />
            ))}
        </>
    );
});
