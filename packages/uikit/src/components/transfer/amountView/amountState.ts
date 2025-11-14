import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { Asset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { TON_ASSET, TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset, legacyTonAssetId } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { getDecimalSeparator, getGroupSeparator } from '@tonkeeper/core/dist/utils/formatting';
import { formatSendValue, isNumeric } from '@tonkeeper/core/dist/utils/send';
import BigNumber from 'bignumber.js';
import { Reducer } from 'react';
import { inputToBigNumber, replaceTypedDecimalSeparator, seeIfValueValid } from './AmountViewUI';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';

function formatStringToInput(value: BigNumber): string {
    return value.toFormat({
        groupSeparator: getGroupSeparator(),
        decimalSeparator: getDecimalSeparator()
    });
}

export type AmountStateAction =
    | { kind: 'select'; payload: { token: Asset } }
    | { kind: 'max'; payload: { balance: AssetAmount; prices?: number } }
    | { kind: 'input'; payload: { value: string; prices?: number } }
    | { kind: 'price'; payload: { prices?: number } }
    | { kind: 'toggle'; payload: undefined };

export type AmountState = {
    inputValue: string;
    assetAmount: AssetAmount;
    fiatValue?: BigNumber;
    inFiat: boolean;
    isMax: boolean;
};

export const amountStateReducer: Reducer<AmountState, AmountStateAction> = (
    state: AmountState,
    action: AmountStateAction
) => {
    const { kind, payload } = action;
    switch (kind) {
        case 'select':
            return {
                inputValue: '0',
                assetAmount: AssetAmount.fromRelativeAmount({
                    asset: payload.token,
                    amount: 0
                }),
                inFiat: false,
                isMax: false
            };
        case 'max': {
            if (payload.prices !== undefined) {
                const fiatValue = payload.balance.relativeAmount
                    .multipliedBy(payload.prices)
                    .decimalPlaces(2, BigNumber.ROUND_FLOOR);

                return {
                    ...state,
                    inputValue: formatStringToInput(
                        state.inFiat ? fiatValue : payload.balance.relativeAmount
                    ),
                    fiatValue: fiatValue,
                    assetAmount: payload.balance,
                    isMax: !state.isMax
                };
            } else {
                return {
                    ...state,
                    inputValue: formatStringToInput(payload.balance.relativeAmount),
                    assetAmount: payload.balance,
                    isMax: !state.isMax
                };
            }
        }

        case 'input': {
            const decimals = state.inFiat ? 2 : state.assetAmount.asset.decimals;

            let inputValue = replaceTypedDecimalSeparator(payload.value);

            if (!seeIfValueValid(inputValue, decimals)) {
                inputValue = state.inputValue;
            }

            if (isNumeric(inputValue)) {
                inputValue = formatSendValue(inputValue);
            }

            const inputAmount = inputToBigNumber(inputValue);

            const coinValue = state.inFiat ? inputAmount.div(payload.prices ?? 0) : inputAmount;
            const fiatValue = state.inFiat
                ? inputAmount
                : inputAmount.multipliedBy(payload.prices ?? 0);

            return {
                ...state,
                inputValue,
                assetAmount: AssetAmount.fromRelativeAmount({
                    asset: state.assetAmount.asset,
                    amount: coinValue
                }),
                fiatValue,
                isMax: false
            };
        }

        case 'price': {
            if (!payload.prices) return state;

            const fiatValue = state.assetAmount.relativeAmount
                .multipliedBy(payload.prices)
                .decimalPlaces(2, BigNumber.ROUND_FLOOR);

            return {
                ...state,
                fiatValue
            };
        }

        case 'toggle': {
            const inputValue = formatStringToInput(
                state.inFiat
                    ? state.assetAmount.relativeAmount.decimalPlaces(
                          state.assetAmount.asset.decimals,
                          BigNumber.ROUND_FLOOR
                      )
                    : state.fiatValue?.decimalPlaces(2, BigNumber.ROUND_FLOOR) ?? new BigNumber(0)
            );

            return {
                ...state,
                inputValue,
                inFiat: !state.inFiat
            };
        }

        default:
            return state;
    }
};

export const toInitAmountState = (
    defaults: Partial<AmountState> | undefined,
    blockchain: BLOCKCHAIN_NAME
): AmountState => {
    const inFiat = defaults?.inFiat ?? false;

    const asset =
        defaults?.assetAmount?.asset ||
        (blockchain === BLOCKCHAIN_NAME.TON ? TON_ASSET : TRON_USDT_ASSET);

    return {
        inputValue:
            defaults?.inputValue ??
            formatStringToInput(
                (inFiat ? defaults?.fiatValue : defaults?.assetAmount?.relativeAmount) ||
                    new BigNumber(0)
            ),
        assetAmount: defaults?.assetAmount ?? AssetAmount.fromRelativeAmount({ asset, amount: 0 }),
        fiatValue: defaults?.fiatValue,
        inFiat,
        isMax: defaults?.isMax ?? false
    };
};

export const toTokenRateSymbol = (amountState: AmountState) => {
    return amountState.assetAmount.asset.blockchain === BLOCKCHAIN_NAME.TRON
        ? amountState.assetAmount.asset.symbol
        : legacyTonAssetId(amountState.assetAmount.asset as TonAsset, { userFriendly: true });
};
