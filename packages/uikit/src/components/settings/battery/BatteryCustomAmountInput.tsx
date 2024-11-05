import {
    useBatteryMinBootstrapValue,
    useBatteryShouldBeReservedAmount,
    usePurchaseBatteryUnitTokenRate
} from '../../../state/battery';
import { legacyTonAssetId, TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import BigNumber from 'bignumber.js';
import { AmountDoubleInput } from '../../fields/AmountDoubleInput';
import styled, { useTheme } from 'styled-components';
import { Body3 } from '../../Text';
import { useAssetWeiBalance } from '../../../state/home';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { useTranslation } from '../../../hooks/translation';

const ContentWrapper = styled.div<{ $isShown: boolean }>`
    display: ${p => (p.$isShown ? 'flex' : 'none')};
    flex-direction: column;
`;

const InputInfoBlock = styled.div`
    display: flex;
    margin-top: 8px;
`;

const Body3Secondary = styled(Body3)`
    color: ${p => p.theme.textSecondary};
    margin-left: auto;
`;

const Body3Error = styled(Body3)`
    color: ${p => p.theme.accentRed};
`;

export const BatteryCustomAmountInput: FC<{
    asset: TonAsset;
    className?: string;
    hidden?: boolean;
    onChange: (state: { tokenValue: BigNumber; error: boolean }) => void;
}> = ({ asset, className, hidden, onChange }) => {
    const { t } = useTranslation();
    const unitToTokenRate = usePurchaseBatteryUnitTokenRate(legacyTonAssetId(asset));
    const shouldReserveAmount = useBatteryShouldBeReservedAmount();
    const weiBalance = useAssetWeiBalance(asset);
    const [selectedAssetAmount, setSelectedAssetAmount] = useState<BigNumber>(new BigNumber(0));
    const isDirty = useRef(false);

    const minValue = useBatteryMinBootstrapValue(asset);

    const remainingAssetAmount = useMemo(() => {
        if (!weiBalance) {
            return undefined;
        }

        const input = AssetAmount.fromRelativeAmount({ asset, amount: selectedAssetAmount });
        return new AssetAmount({
            asset,
            weiAmount: weiBalance.minus(input.weiAmount)
        });
    }, [selectedAssetAmount, asset, weiBalance]);

    const currencies = useMemo(
        () => [
            {
                id: 'token',
                label: asset.symbol,
                decimals: asset.decimals
            },
            {
                id: 'charge_unit',
                label: <FlashIconAdaptive />,
                decimals: 2
            }
        ],
        [asset.symbol, asset.decimals]
    );

    const error = useMemo(() => {
        if (!isDirty.current) {
            return undefined;
        }

        if (remainingAssetAmount?.weiAmount.lt(0)) {
            return t('battery_buy_error_not_enough_balance');
        }

        if (minValue && selectedAssetAmount.lt(minValue.relativeAmount)) {
            return t('battery_buy_error_min', {
                amount: minValue.stringRelativeAmount
            });
        }
    }, [t, remainingAssetAmount, asset, minValue, selectedAssetAmount]);

    useEffect(() => {
        if (selectedAssetAmount.lte(0)) {
            return onChange({ tokenValue: selectedAssetAmount, error: true });
        }

        onChange({ tokenValue: selectedAssetAmount, error: !!error });
    }, [selectedAssetAmount, error]);

    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (ref.current && !hidden) {
            ref.current.focus();
        }
    }, [hidden]);

    if (!unitToTokenRate || !shouldReserveAmount || !remainingAssetAmount) {
        return null;
    }

    const rateFunction = ({ currencyId, value }: { currencyId: string; value: BigNumber }) => {
        if (currencyId === 'token') {
            const willGetBatteryUnits = value
                .div(unitToTokenRate)
                .minus(shouldReserveAmount.batteryUnits);
            return willGetBatteryUnits.lt(0) ? new BigNumber(0) : willGetBatteryUnits;
        }

        return value.plus(shouldReserveAmount.batteryUnits).multipliedBy(unitToTokenRate);
    };

    const onInputChange = ({ currencyId, input }: { currencyId: string; input: BigNumber }) => {
        if (!input) {
            return setSelectedAssetAmount(new BigNumber(0));
        }

        if (!input.isZero()) {
            isDirty.current = true;
        }

        if (currencyId === 'token') {
            return setSelectedAssetAmount(input);
        }

        setSelectedAssetAmount(
            input.plus(shouldReserveAmount.batteryUnits).multipliedBy(unitToTokenRate)
        );
    };

    return (
        <ContentWrapper className={className} $isShown={!hidden}>
            <AmountDoubleInput
                currencies={currencies}
                rate={rateFunction}
                onChange={onInputChange}
                ref={ref}
            />
            <InputInfoBlock>
                {error && <Body3Error>{error}</Body3Error>}
                {remainingAssetAmount.weiAmount.gt(0) && (
                    <Body3Secondary>
                        {t('battery_buy_remaining', {
                            value: remainingAssetAmount.stringAssetRelativeAmount
                        })}
                    </Body3Secondary>
                )}
            </InputInfoBlock>
        </ContentWrapper>
    );
};

const FlashIconAdaptive = () => {
    const theme = useTheme();
    const [size, setSize] = useState('16');
    const ref = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (ref.current) {
            setSize(getComputedStyle(ref.current).fontSize);
        }
    });

    return (
        <svg
            ref={ref}
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            style={{ display: 'block' }}
        >
            <path
                d="M4.60096 6.47917L7.63932 2.83314C8.58952 1.6929 9.06462 1.12278 9.41228 1.2822C9.75995 1.44162 9.63794 2.17365 9.39393 3.63772L9.12487 5.2521C9.06584 5.60627 9.03633 5.78336 9.1255 5.91554C9.21467 6.04773 9.38993 6.08667 9.74044 6.16456L10.2969 6.28822C11.7302 6.60672 12.4468 6.76597 12.6281 7.29752C12.8094 7.82907 12.3394 8.39303 11.3995 9.52096L8.3611 13.167C7.4109 14.3072 6.9358 14.8774 6.58813 14.7179C6.24047 14.5585 6.36247 13.8265 6.60648 12.3624L6.87555 10.748C6.93458 10.3939 6.96409 10.2168 6.87492 10.0846C6.78575 9.95241 6.61049 9.91346 6.25999 9.83557L5.70354 9.71192C4.27027 9.39341 3.55363 9.23416 3.37234 8.70261C3.19104 8.17107 3.66102 7.6071 4.60096 6.47917Z"
                fill={theme.iconSecondary}
            />
        </svg>
    );
};
