import { FC, useCallback, useEffect } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { ListBlock, ListItem, ListItemPayload } from '../../List';
import {
    useBatteryPacksReservedApplied,
    useBatteryUnitTonRate,
    usePurchaseBatteryUnitTokenRate
} from '../../../state/battery';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
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
    selectedPackType?: string;
    onPackTypeChange: (packType: string) => void;
}> = ({ className, asset, selectedPackType, onPackTypeChange }) => {
    const packs = useBatteryPacksReservedApplied();
    const { t } = useTranslation();
    const unitToTonRate = useBatteryUnitTonRate();
    const unitToTokenRate = usePurchaseBatteryUnitTokenRate(legacyTonAssetId(asset));

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
        [asset, unitToTonRate, unitToTokenRate]
    );

    const isPackAvailable = useCallback(
        (packPrice: AssetAmount) =>
            assetWeiBalance && packPriceInToken(packPrice).weiAmount.lt(assetWeiBalance),
        [assetWeiBalance, packPriceInToken]
    );

    const allDataFetched = unitToTokenRate && packs && tokenRate && assetWeiBalance;

    useEffect(() => {
        if (!allDataFetched) {
            return;
        }

        if (selectedPackType === 'custom') {
            return;
        }

        const selectedPack = packs!.find(p => p.type === selectedPackType);
        if (selectedPack && isPackAvailable(selectedPack.price)) {
            return;
        }

        const firstAvailablePack = packs!.find(p => isPackAvailable(p.price));
        if (firstAvailablePack) {
            onPackTypeChange(firstAvailablePack.type);
        } else {
            onPackTypeChange('custom');
        }
    }, [isPackAvailable, packs, allDataFetched, selectedPackType, onPackTypeChange]);

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
                    key={pack.type}
                    hover={false}
                    $disabled={!isPackAvailable(pack.price)}
                    onClick={() => {
                        if (pack.type !== selectedPackType && isPackAvailable(pack.price)) {
                            onPackTypeChange(pack.type);
                        }
                    }}
                >
                    <ListItemPayloadStyled>
                        <BatteryIcon40 type={pack.type} />
                        <ColumnText
                            text={t('battery_charges', {
                                charges: packCharges(pack.value)
                            })}
                            secondary={`${
                                packPriceInToken(pack.price).stringAssetRelativeAmount
                            } · ${packPriceInFiat(pack.price)}`}
                        />
                        <RadioStyled checked={pack.type === selectedPackType} />
                    </ListItemPayloadStyled>
                </ListItemStyled>
            ))}
            <ListItemStyled
                key="custom"
                hover={false}
                onClick={() => {
                    if (selectedPackType !== 'custom') {
                        onPackTypeChange('custom');
                    }
                }}
            >
                <ListItemPayloadStyled>
                    <BatteryIcon40 type="custom" />
                    <ColumnText
                        text={t('battery_recharge_by_crypto_other_title')}
                        secondary={t('battery_recharge_by_crypto_other_subtitle')}
                    />
                    <RadioStyled checked={selectedPackType === 'custom'} />
                </ListItemPayloadStyled>
            </ListItemStyled>
        </ListBlock>
    );
};

const BatteryFullIcon40 = () => {
    const theme = useTheme();

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="40"
            viewBox="0 0 24 40"
            fill="none"
        >
            <path
                opacity="0.64"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.12333 3.01631C8.56305 1.28479 10.1322 0.00390625 12.0005 0.00390625C13.8688 0.00390625 15.4379 1.28479 15.8776 3.01629C18.6646 3.06008 20.2999 3.25771 21.5277 4.14973C22.0371 4.51981 22.485 4.96775 22.8551 5.47712C24.001 7.05431 24.001 9.30415 24.001 13.8038V29.2038C24.001 33.7035 24.001 35.9534 22.8551 37.5305C22.485 38.0399 22.0371 38.4879 21.5277 38.8579C19.9505 40.0038 17.7007 40.0038 13.201 40.0038H10.801C6.3013 40.0038 4.05146 40.0038 2.47427 38.8579C1.9649 38.4879 1.51695 38.0399 1.14687 37.5305C0.000976562 35.9534 0.000976562 33.7035 0.000976562 29.2038V13.8038C0.000976562 9.30415 0.000976562 7.05431 1.14687 5.47712C1.51695 4.96775 1.9649 4.51981 2.47427 4.14973C3.70187 3.25782 5.33699 3.06013 8.12333 3.01631ZM1.50049 11.7038C1.50049 9.1836 1.50049 7.92348 1.99096 6.96087C2.42239 6.11414 3.1108 5.42573 3.95753 4.9943C4.92013 4.50383 6.18025 4.50383 8.70049 4.50383H15.3005C17.8207 4.50383 19.0808 4.50383 20.0434 4.9943C20.8902 5.42573 21.5786 6.11414 22.01 6.96087C22.5005 7.92348 22.5005 9.18359 22.5005 11.7038V31.3038C22.5005 33.8241 22.5005 35.0842 22.01 36.0468C21.5786 36.8935 20.8902 37.5819 20.0434 38.0134C19.0808 38.5038 17.8207 38.5038 15.3005 38.5038H8.70049C6.18025 38.5038 4.92013 38.5038 3.95753 38.0134C3.1108 37.5819 2.42239 36.8935 1.99096 36.0468C1.50049 35.0842 1.50049 33.8241 1.50049 31.3038V11.7038Z"
                fill={theme.iconTertiary}
            />
            <path
                d="M3 11.4039C3 9.15407 3 8.02915 3.57295 7.24055C3.75799 6.98587 3.98196 6.76189 4.23664 6.57686C5.02524 6.00391 6.15016 6.00391 8.4 6.00391H15.6C17.8498 6.00391 18.9748 6.00391 19.7634 6.57686C20.018 6.76189 20.242 6.98587 20.4271 7.24055C21 8.02915 21 9.15407 21 11.4039V31.6039C21 33.8537 21 34.9787 20.4271 35.7673C20.242 36.0219 20.018 36.2459 19.7634 36.431C18.9748 37.0039 17.8498 37.0039 15.6 37.0039H8.4C6.15016 37.0039 5.02524 37.0039 4.23664 36.431C3.98196 36.2459 3.75799 36.0219 3.57295 35.7673C3 34.9787 3 33.8537 3 31.6039V11.4039Z"
                fill={theme.accentBlueConstant}
            />
        </svg>
    );
};

const BatteryHalfIcon40 = () => {
    const theme = useTheme();

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="40"
            viewBox="0 0 24 40"
            fill="none"
        >
            <path
                opacity="0.64"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.12333 3.01631C8.56305 1.28479 10.1322 0.00390625 12.0005 0.00390625C13.8688 0.00390625 15.4379 1.28479 15.8776 3.01629C18.6646 3.06008 20.2999 3.25771 21.5277 4.14973C22.0371 4.51981 22.485 4.96775 22.8551 5.47712C24.001 7.05431 24.001 9.30415 24.001 13.8038V29.2038C24.001 33.7035 24.001 35.9534 22.8551 37.5305C22.485 38.0399 22.0371 38.4879 21.5277 38.8579C19.9505 40.0038 17.7007 40.0038 13.201 40.0038H10.801C6.3013 40.0038 4.05146 40.0038 2.47427 38.8579C1.9649 38.4879 1.51695 38.0399 1.14687 37.5305C0.000976562 35.9534 0.000976562 33.7035 0.000976562 29.2038V13.8038C0.000976562 9.30415 0.000976562 7.05431 1.14687 5.47712C1.51695 4.96775 1.9649 4.51981 2.47427 4.14973C3.70187 3.25782 5.33699 3.06013 8.12333 3.01631ZM1.50049 11.7038C1.50049 9.1836 1.50049 7.92348 1.99096 6.96087C2.42239 6.11414 3.1108 5.42573 3.95753 4.9943C4.92013 4.50383 6.18025 4.50383 8.70049 4.50383H15.3005C17.8207 4.50383 19.0808 4.50383 20.0434 4.9943C20.8902 5.42573 21.5786 6.11414 22.01 6.96087C22.5005 7.92348 22.5005 9.18359 22.5005 11.7038V31.3038C22.5005 33.8241 22.5005 35.0842 22.01 36.0468C21.5786 36.8935 20.8902 37.5819 20.0434 38.0134C19.0808 38.5038 17.8207 38.5038 15.3005 38.5038H8.70049C6.18025 38.5038 4.92013 38.5038 3.95753 38.0134C3.1108 37.5819 2.42239 36.8935 1.99096 36.0468C1.50049 35.0842 1.50049 33.8241 1.50049 31.3038V11.7038Z"
                fill={theme.iconTertiary}
            />
            <path
                d="M3 26.4039C3 24.1541 3 23.0291 3.57295 22.2406C3.75799 21.9859 3.98196 21.7619 4.23664 21.5769C5.02524 21.0039 6.15016 21.0039 8.4 21.0039H15.6C17.8498 21.0039 18.9748 21.0039 19.7634 21.5769C20.018 21.7619 20.242 21.9859 20.4271 22.2406C21 23.0291 21 24.1541 21 26.4039V31.6039C21 33.8537 21 34.9787 20.4271 35.7673C20.242 36.0219 20.018 36.2459 19.7634 36.431C18.9748 37.0039 17.8498 37.0039 15.6 37.0039H8.4C6.15016 37.0039 5.02524 37.0039 4.23664 36.431C3.98196 36.2459 3.75799 36.0219 3.57295 35.7673C3 34.9787 3 33.8537 3 31.6039V26.4039Z"
                fill={theme.accentBlueConstant}
            />
        </svg>
    );
};

const BatteryQuarterIcon40 = () => {
    const theme = useTheme();

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="40"
            viewBox="0 0 24 40"
            fill="none"
        >
            <path
                opacity="0.64"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.12333 3.01631C8.56305 1.28479 10.1322 0.00390625 12.0005 0.00390625C13.8688 0.00390625 15.4379 1.28479 15.8776 3.01629C18.6646 3.06008 20.2999 3.25771 21.5277 4.14973C22.0371 4.51981 22.485 4.96775 22.8551 5.47712C24.001 7.05431 24.001 9.30415 24.001 13.8038V29.2038C24.001 33.7035 24.001 35.9534 22.8551 37.5305C22.485 38.0399 22.0371 38.4879 21.5277 38.8579C19.9505 40.0038 17.7007 40.0038 13.201 40.0038H10.801C6.3013 40.0038 4.05146 40.0038 2.47427 38.8579C1.9649 38.4879 1.51695 38.0399 1.14687 37.5305C0.000976562 35.9534 0.000976562 33.7035 0.000976562 29.2038V13.8038C0.000976562 9.30415 0.000976562 7.05431 1.14687 5.47712C1.51695 4.96775 1.9649 4.51981 2.47427 4.14973C3.70187 3.25782 5.33699 3.06013 8.12333 3.01631ZM1.50049 11.7038C1.50049 9.1836 1.50049 7.92348 1.99096 6.96087C2.42239 6.11414 3.1108 5.42573 3.95753 4.9943C4.92013 4.50383 6.18025 4.50383 8.70049 4.50383H15.3005C17.8207 4.50383 19.0808 4.50383 20.0434 4.9943C20.8902 5.42573 21.5786 6.11414 22.01 6.96087C22.5005 7.92348 22.5005 9.18359 22.5005 11.7038V31.3038C22.5005 33.8241 22.5005 35.0842 22.01 36.0468C21.5786 36.8935 20.8902 37.5819 20.0434 38.0134C19.0808 38.5038 17.8207 38.5038 15.3005 38.5038H8.70049C6.18025 38.5038 4.92013 38.5038 3.95753 38.0134C3.1108 37.5819 2.42239 36.8935 1.99096 36.0468C1.50049 35.0842 1.50049 33.8241 1.50049 31.3038V11.7038Z"
                fill={theme.iconTertiary}
            />
            <path
                d="M3 32.0039C3 30.1347 3 29.2001 3.40192 28.5039C3.66523 28.0478 4.04394 27.6691 4.5 27.4058C5.19615 27.0039 6.13077 27.0039 8 27.0039H16C17.8692 27.0039 18.8038 27.0039 19.5 27.4058C19.9561 27.6691 20.3348 28.0478 20.5981 28.5039C21 29.2001 21 30.1347 21 32.0039C21 33.8731 21 34.8078 20.5981 35.5039C20.3348 35.96 19.9561 36.3387 19.5 36.602C18.8038 37.0039 17.8692 37.0039 16 37.0039H8C6.13077 37.0039 5.19615 37.0039 4.5 36.602C4.04394 36.3387 3.66523 35.96 3.40192 35.5039C3 34.8078 3 33.8731 3 32.0039Z"
                fill={theme.accentBlueConstant}
            />
        </svg>
    );
};

const BatteryChargingIcon40 = () => {
    const theme = useTheme();

    return (
        <svg
            width="24"
            height="40"
            viewBox="0 0 24 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                opacity="0.64"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.12333 3.01631C8.56305 1.28479 10.1322 0.00390625 12.0005 0.00390625C13.8688 0.00390625 15.4379 1.28479 15.8776 3.01629C18.6646 3.06008 20.2999 3.25771 21.5277 4.14973C22.0371 4.51981 22.485 4.96775 22.8551 5.47712C24.001 7.05431 24.001 9.30415 24.001 13.8038V29.2038C24.001 33.7035 24.001 35.9534 22.8551 37.5305C22.485 38.0399 22.0371 38.4879 21.5277 38.8579C19.9505 40.0038 17.7007 40.0038 13.201 40.0038H10.801C6.3013 40.0038 4.05146 40.0038 2.47427 38.8579C1.9649 38.4879 1.51695 38.0399 1.14687 37.5305C0.000976562 35.9534 0.000976562 33.7035 0.000976562 29.2038V13.8038C0.000976562 9.30415 0.000976562 7.05431 1.14687 5.47712C1.51695 4.96775 1.9649 4.51981 2.47427 4.14973C3.70187 3.25782 5.33699 3.06013 8.12333 3.01631ZM1.50049 11.7038C1.50049 9.1836 1.50049 7.92348 1.99096 6.96087C2.42239 6.11414 3.1108 5.42573 3.95753 4.9943C4.92013 4.50383 6.18025 4.50383 8.70049 4.50383H15.3005C17.8207 4.50383 19.0808 4.50383 20.0434 4.9943C20.8902 5.42573 21.5786 6.11414 22.01 6.96087C22.5005 7.92348 22.5005 9.18359 22.5005 11.7038V31.3038C22.5005 33.8241 22.5005 35.0842 22.01 36.0468C21.5786 36.8935 20.8902 37.5819 20.0434 38.0134C19.0808 38.5038 17.8207 38.5038 15.3005 38.5038H8.70049C6.18025 38.5038 4.92013 38.5038 3.95753 38.0134C3.1108 37.5819 2.42239 36.8935 1.99096 36.0468C1.50049 35.0842 1.50049 33.8241 1.50049 31.3038V11.7038Z"
                fill={theme.iconTertiary}
            />
            <path
                d="M6.90143 19.2217L11.459 13.7526C12.8843 12.0423 13.5969 11.1871 14.1184 11.4262C14.6399 11.6654 14.4569 12.7634 14.0909 14.9595L13.6873 17.3811C13.5988 17.9123 13.5545 18.178 13.6883 18.3762C13.822 18.5745 14.0849 18.6329 14.6107 18.7498L15.4453 18.9353C17.5952 19.413 18.6702 19.6519 18.9421 20.4492C19.2141 21.2465 18.5091 22.0925 17.0992 23.7844L12.5416 29.2534C11.1163 30.9638 10.4037 31.819 9.8822 31.5798C9.3607 31.3407 9.54371 30.2426 9.90973 28.0466L10.3133 25.625C10.4019 25.0937 10.4461 24.8281 10.3124 24.6298C10.1786 24.4315 9.91574 24.3731 9.38998 24.2563L8.5553 24.0708C6.4054 23.593 5.33045 23.3542 5.05851 22.5568C4.78657 21.7595 5.49152 20.9136 6.90143 19.2217Z"
                fill={theme.accentGreen}
            />
        </svg>
    );
};

const BatteryIcon40: FC<{ type: 'large' | 'medium' | 'small' | 'custom' }> = ({ type }) => {
    if (type === 'large') {
        return <BatteryFullIcon40 />;
    }

    if (type === 'medium') {
        return <BatteryHalfIcon40 />;
    }

    if (type === 'small') {
        return <BatteryQuarterIcon40 />;
    }

    if (type === 'custom') {
        return <BatteryChargingIcon40 />;
    }

    assertUnreachable(type);
};
