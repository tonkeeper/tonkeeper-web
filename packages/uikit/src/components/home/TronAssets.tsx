import { TronBalances } from '@tonkeeper/core/dist/tronApi';
import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../../libs/routes';
import { useFormatFiat, useRate } from '../../state/rates';
import { ListItem } from '../List';
import { ListItemPayload, TokenLayout, TokenLogo } from './TokenLayout';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';

const TronAsset: FC<{ assetAmount: AssetAmount<TronAsset> }> = ({ assetAmount }) => {
    const navigate = useNavigate();

    const { data } = useRate(token.symbol);
    const { fiatPrice, fiatAmount } = useFormatFiat(data, amount);

    return (
        <ListItem onClick={() => navigate(AppRoute.coins + '/tron/' + token.address)}>
            <ListItemPayload>
                <TokenLogo src={assetAmount.image} />
                <TokenLayout
                    name={assetAmount.asset.name!}
                    symbol={assetAmount.asset.symbol}
                    balance={assetAmount.stringAssetRelativeAmount}
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
