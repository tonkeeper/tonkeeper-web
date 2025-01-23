import React, { FC, forwardRef } from 'react';
import { AppRoute } from '../../libs/routes';
import { useFormatFiat, useUSDTRate } from '../../state/rates';
import { ListItem } from '../List';
import { ListItemPayload, TokenLayout, TokenLogo } from './TokenLayout';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { Button } from '../fields/Button';
import { formatFiatCurrency } from '../../hooks/balance';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useAddTronToAccount } from '../../state/wallet';
import styled from 'styled-components';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { useNavigate } from '../../hooks/router/useNavigate';

const TokenLogoNotRounded = styled(TokenLogo)`
    border-radius: unset;
`;

export const TronAssetComponent = forwardRef<
    HTMLDivElement,
    {
        assetAmount: AssetAmount<TronAsset>;
        className?: string;
    }
>(({ assetAmount, className }, ref) => {
    const navigate = useNavigate();

    const { data: rate } = useUSDTRate();
    const { fiatPrice, fiatAmount } = useFormatFiat(rate, assetAmount.relativeAmount);

    return (
        <ListItem
            onClick={() =>
                navigate(AppRoute.coins + '/' + assetAmount.asset.id, { replace: false })
            }
            className={className}
            ref={ref}
        >
            <ListItemPayload>
                {assetAmount.asset.id === TRON_USDT_ASSET.id ? (
                    <TokenLogoNotRounded src={assetAmount.image} />
                ) : (
                    <TokenLogo src={assetAmount.image} />
                )}
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
});

const InactiveUSDA: FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();

    const { mutate, isLoading } = useAddTronToAccount();
    const isFullWidth = useIsFullWidthMode();
    const { data: rate } = useUSDTRate();

    return (
        <ListItem className={className}>
            <ListItemPayload>
                <TokenLogoNotRounded src={TRON_USDT_ASSET.image} />
                <TokenLayout
                    name={TRON_USDT_ASSET.name!}
                    symbol={TRON_USDT_ASSET.symbol}
                    balance=""
                    secondary={rate?.prices ? formatFiatCurrency(fiat, rate?.prices) : undefined}
                    fiatAmount=""
                    label="TRC20"
                    rate={rate}
                />
                <Button
                    {...(isFullWidth ? { secondary: true } : { primary: true })}
                    size="small"
                    loading={isLoading}
                    onClick={() => mutate()}
                >
                    {t('activate')}
                </Button>
            </ListItemPayload>
        </ListItem>
    );
};

export const TronAssets: FC<{ usdt: AssetAmount | null; className?: string }> = React.memo(
    ({ usdt, className }) => {
        if (!usdt) {
            return <InactiveUSDA className={className} />;
        }
        return (
            <TronAssetComponent
                assetAmount={usdt as AssetAmount<TronAsset>}
                className={className}
            />
        );
    }
);
