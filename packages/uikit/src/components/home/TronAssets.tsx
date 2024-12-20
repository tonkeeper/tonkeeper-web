import React, { FC, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../../libs/routes';
import { useFormatFiat } from '../../state/rates';
import { ListItem } from '../List';
import { ListItemPayload, TokenLayout, TokenLogo } from './TokenLayout';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TronBalances } from '../../state/tron/tron';
import { Button } from '../fields/Button';
import { formatFiatCurrency } from '../../hooks/balance';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useAddTronToAccount } from '../../state/wallet';

const usdtRate = {
    diff7d: '',
    diff24h: '',
    prices: 1
};

const tronAssetRate = (asset: TronAsset) => {
    if (asset.id === TRON_USDT_ASSET.id) {
        return usdtRate;
    }

    return undefined;
};

const TronAssetComponent: FC<{ assetAmount: AssetAmount<TronAsset>; className?: string }> = ({
    assetAmount,
    className
}) => {
    const navigate = useNavigate();

    const rate = useMemo(() => tronAssetRate(assetAmount.asset), [assetAmount.asset.id]);

    const { fiatPrice, fiatAmount } = useFormatFiat(rate, assetAmount.relativeAmount);

    return (
        <ListItem
            onClick={() => navigate(AppRoute.coins + '/' + assetAmount.asset.id)}
            className={className}
        >
            <ListItemPayload>
                <TokenLogo src={assetAmount.image} />
                <TokenLayout
                    name={assetAmount.asset.name!}
                    symbol={assetAmount.asset.symbol}
                    balance={assetAmount.stringRelativeAmount}
                    secondary={fiatPrice}
                    fiatAmount={fiatAmount}
                    label="TRC20"
                    rate={rate}
                />
            </ListItemPayload>
        </ListItem>
    );
};

const InactiveUSDA: FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();

    const { mutate, isLoading } = useAddTronToAccount();

    return (
        <ListItem className={className}>
            <ListItemPayload>
                <TokenLogo src={TRON_USDT_ASSET.image} />
                <TokenLayout
                    name={TRON_USDT_ASSET.name!}
                    symbol={TRON_USDT_ASSET.symbol}
                    balance=""
                    secondary={formatFiatCurrency(fiat, usdtRate.prices)}
                    fiatAmount=""
                    label="TRC20"
                    rate={usdtRate}
                />
                <Button secondary size="small" loading={isLoading} onClick={() => mutate()}>
                    {t('activate')}
                </Button>
            </ListItemPayload>
        </ListItem>
    );
};

export const TronAssets: FC<{ balances: TronBalances; className?: string }> = React.memo(
    ({ balances, className }) => {
        if (!balances) {
            return <InactiveUSDA className={className} />;
        }
        return <TronAssetComponent assetAmount={balances.usdt} className={className} />;
    }
);
