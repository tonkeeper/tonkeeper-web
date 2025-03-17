import { FC, useCallback, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { ListBlock, ListItem, ListItemPayload } from '../../List';
import {
    useBatteryMinBootstrapValue,
    useBatteryPacksReservedApplied,
    useBatteryUnitTonRate,
    usePurchaseBatteryUnitTokenRate
} from '../../../state/battery';
import { useTranslation } from '../../../hooks/translation';
import BigNumber from 'bignumber.js';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { ColumnText } from '../../Layout';
import { legacyTonAssetId, TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { useRate } from '../../../state/rates';
import { formatFiatCurrency } from '../../../hooks/balance';
import { useUserFiat } from '../../../state/fiat';
import { Radio } from '../../fields/Checkbox';
import { SkeletonImage, SkeletonText } from '../../shared/Skeleton';
import { useAssetWeiBalance } from '../../../state/home';
import { BatteryChargingIcon } from './BatteryIcons';

const ListItemStyled = styled(ListItem)<{ $disabled?: boolean }>`
    padding: 0;
    cursor: pointer;

    ${p =>
        p.$disabled &&
        css`
            opacity: 0.6;
            cursor: not-allowed;
        `}

    & + & > div {
        padding-top: 11px;
    }
`;

const ListItemPayloadStyled = styled(ListItemPayload)`
    justify-content: flex-start;
    padding: 12px;

    &:nth-child(2) {
        padding-right: 6px;
    }
`;

const RadioStyled = styled(Radio)`
    margin-left: auto;
`;

export const BatteryPacksSelect: FC<{
    className?: string;
    asset: TonAsset;
    selectedPackId?: string;
    onPackIdChange: (packId: string) => void;
}> = ({ className, asset, selectedPackId, onPackIdChange }) => {
    const packs = useBatteryPacksReservedApplied();
    const { t } = useTranslation();
    const unitToTonRate = useBatteryUnitTonRate();
    const unitToTokenRate = usePurchaseBatteryUnitTokenRate(legacyTonAssetId(asset));
    const minValue = useBatteryMinBootstrapValue(asset);

    const { data: tokenRate } = useRate(legacyTonAssetId(asset));
    const fiat = useUserFiat();

    const assetWeiBalance = useAssetWeiBalance(asset);

    const packPriceInToken = useCallback(
        (packPrice: AssetAmount) =>
            AssetAmount.fromRelativeAmount({
                amount: packPrice.relativeAmount
                    .div(unitToTonRate)
                    .multipliedBy(unitToTokenRate || 1),
                asset: asset
            }),
        [asset, unitToTokenRate]
    );

    const isPackAvailable = useCallback(
        (packPrice: AssetAmount) =>
            assetWeiBalance &&
            packPriceInToken(packPrice).weiAmount.lt(assetWeiBalance) &&
            packPriceInToken(packPrice).isGT(minValue!),
        [assetWeiBalance, packPriceInToken]
    );

    const allDataFetched = unitToTokenRate && packs && tokenRate && assetWeiBalance && minValue;

    useEffect(() => {
        if (!allDataFetched) {
            return;
        }

        if (selectedPackId === 'custom') {
            return;
        }

        const selectedPack = packs!.find(p => p.id === selectedPackId);
        if (selectedPack && isPackAvailable(selectedPack.price)) {
            return;
        }

        const firstAvailablePack = packs!.find(p => isPackAvailable(p.price));
        if (firstAvailablePack) {
            onPackIdChange(firstAvailablePack.id);
        } else {
            onPackIdChange('custom');
        }
    }, [isPackAvailable, packs, allDataFetched, selectedPackId, onPackIdChange]);

    if (!allDataFetched) {
        return (
            <ListBlock className={className} margin={false}>
                {[...new Array(4)].map((_, index) => (
                    <ListItemStyled key={index}>
                        <ListItemPayloadStyled>
                            <SkeletonImage width="40px" />
                            <SkeletonText size="large" width="200px" />
                        </ListItemPayloadStyled>
                    </ListItemStyled>
                ))}
            </ListBlock>
        );
    }

    const packCharges = (packValue: AssetAmount) =>
        packValue.relativeAmount.div(unitToTonRate).integerValue(BigNumber.ROUND_DOWN).toNumber();

    const packPriceInFiat = (packPrice: AssetAmount) =>
        formatFiatCurrency(
            fiat,
            packPriceInToken(packPrice).relativeAmount.multipliedBy(tokenRate.prices)
        );

    return (
        <ListBlock className={className} margin={false}>
            {packs.map(pack => (
                <ListItemStyled
                    key={pack.id}
                    hover={false}
                    $disabled={!isPackAvailable(pack.price)}
                    onClick={() => {
                        if (pack.id !== selectedPackId && isPackAvailable(pack.price)) {
                            onPackIdChange(pack.id);
                        }
                    }}
                >
                    <ListItemPayloadStyled>
                        {pack.image}
                        <ColumnText
                            text={t('battery_charges', {
                                charges: packCharges(pack.value)
                            })}
                            secondary={`${
                                packPriceInToken(pack.price).stringAssetRelativeAmount
                            } · ${packPriceInFiat(pack.price)}`}
                        />
                        <RadioStyled checked={pack.id === selectedPackId} />
                    </ListItemPayloadStyled>
                </ListItemStyled>
            ))}
            <ListItemStyled
                key="custom"
                hover={false}
                onClick={() => {
                    if (selectedPackId !== 'custom') {
                        onPackIdChange('custom');
                    }
                }}
            >
                <ListItemPayloadStyled>
                    <BatteryChargingIcon />
                    <ColumnText
                        text={t('battery_recharge_by_crypto_other_title')}
                        secondary={t('battery_recharge_by_crypto_other_subtitle')}
                    />
                    <RadioStyled checked={selectedPackId === 'custom'} />
                </ListItemPayloadStyled>
            </ListItemStyled>
        </ListBlock>
    );
};
