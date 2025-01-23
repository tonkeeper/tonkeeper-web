import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { Account, JettonsBalances } from '@tonkeeper/core/dist/tonApiV2';
import React, { FC, forwardRef, useMemo } from 'react';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { AppRoute } from '../../libs/routes';
import { toTokenRate, useFormatFiat, useRate } from '../../state/rates';
import { ListBlock, ListItem } from '../List';
import { ListItemPayload, TokenLayout, TokenLogo } from './TokenLayout';
import {
    TronBalances,
    useActiveTronWallet,
    useCanUseTronForActiveWallet
} from '../../state/tron/tron';
import { TronAssetComponent, TronAssets } from './TronAssets';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import { isTronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import {
    tonAssetAddressToString,
    TonAsset as TonAssetType
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { useJettonList } from '../../state/jetton';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { useNavigate } from '../../hooks/router/useNavigate';

export interface TonAssetData {
    info: Account;
    jettons: JettonsBalances;
}

export interface AssetData {
    ton: TonAssetData;
    tron: TronBalances;
}

export interface AssetProps {
    assets: AssetData;
}

export const TonAsset = forwardRef<
    HTMLDivElement,
    {
        balance: AssetAmount;
        className?: string;
    }
>(({ balance, className }, ref) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const { data } = useRate(CryptoCurrency.TON);
    const { fiatPrice, fiatAmount } = useFormatFiat(data, balance.relativeAmount);

    return (
        <ListItem
            onClick={() => navigate(AppRoute.coins + '/ton', { replace: false })}
            className={className}
            ref={ref}
        >
            <ListItemPayload>
                <TokenLogo src="https://wallet.tonkeeper.com/img/toncoin.svg" />
                <TokenLayout
                    name={t('Toncoin')}
                    symbol={balance.asset.symbol}
                    balance={balance.stringRelativeAmount}
                    secondary={fiatPrice}
                    fiatAmount={fiatAmount}
                    rate={data}
                />
            </ListItemPayload>
        </ListItem>
    );
});

export const AnyChainAsset = forwardRef<
    HTMLDivElement,
    {
        balance: AssetAmount;
        className?: string;
    }
>(({ balance, className }, ref) => {
    if (isTronAsset(balance.asset)) {
        return (
            <TronAssetComponent
                ref={ref}
                assetAmount={balance as AssetAmount<TronAsset>}
                className={className}
            />
        );
    } else {
        return <JettonAsset ref={ref} balance={balance} className={className} />;
    }
});

export const JettonAsset = forwardRef<
    HTMLDivElement,
    {
        balance: AssetAmount;
        className?: string;
    }
>(({ balance, className }, ref) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { fiat } = useAppContext();

    const { data: jettonBalances } = useJettonList();

    const rate = useMemo(() => {
        const jetton = jettonBalances?.balances.find(j =>
            eqAddresses(j.jetton.address, balance.asset.address)
        );

        return jetton?.price ? toTokenRate(jetton.price, fiat) : undefined;
    }, [jettonBalances, fiat]);
    const { fiatPrice, fiatAmount } = useFormatFiat(rate, balance.relativeAmount);

    const verification = useMemo(
        () =>
            jettonBalances?.balances.find(j => eqAddresses(j.jetton.address, balance.asset.address))
                ?.jetton.verification,
        [jettonBalances, fiat]
    );

    return (
        <ListItem
            onClick={() =>
                navigate(
                    AppRoute.coins +
                        `/${encodeURIComponent(
                            tonAssetAddressToString((balance.asset as TonAssetType).address)
                        )}`,
                    {
                        replace: false
                    }
                )
            }
            className={className}
            ref={ref}
        >
            <ListItemPayload>
                <TokenLogo src={balance.asset.image} />
                <TokenLayout
                    name={balance.asset.name ?? t('Unknown_COIN')}
                    verification={verification}
                    symbol={balance.asset.symbol}
                    balance={balance.stringRelativeAmount}
                    secondary={fiatPrice}
                    fiatAmount={fiatAmount}
                    rate={rate}
                />
            </ListItemPayload>
        </ListItem>
    );
});

export const JettonList: FC<{ assets: AssetAmount[] }> = ({ assets }) => {
    const [tonAssetAmount, restAssets] = useMemo(() => {
        return [
            assets.find(item => item.asset.id === TON_ASSET.id)!,
            assets.filter(item => item.asset.id !== TON_ASSET.id)
        ];
    }, [assets]);
    const canUseTron = useCanUseTronForActiveWallet();
    const tronWallet = useActiveTronWallet();

    return (
        <>
            <ListBlock noUserSelect>
                <TonAsset balance={tonAssetAmount} />
                {!tronWallet && canUseTron && <TronAssets usdt={null} />}
            </ListBlock>
            <ListBlock noUserSelect>
                {restAssets.map(item => (
                    <AnyChainAsset key={item.asset.id} balance={item} />
                ))}
            </ListBlock>
        </>
    );
};
