import { Notification } from '../../Notification';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from '../../../hooks/translation';
import styled from 'styled-components';
import { AssetSelect } from '../../fields/AssetSelect';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { BatteryPacksSelect } from './BatteryPacksSelect';
import { useAsset } from '../../../state/home';
import { legacyTonAssetId, TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import {
    useBatteryAvailableRechargeMethods,
    useBatteryPacksReservedApplied,
    useBatteryUnitTonRate,
    usePurchaseBatteryUnitTokenRate
} from '../../../state/battery';
import { BatteryCustomAmountInput } from './BatteryCustomAmountInput';
import BigNumber from 'bignumber.js';
import { ButtonResponsiveSize } from '../../fields/Button';
import { BuyBatteryConfirmNotification } from './BuyBatteryConfirmNotification';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { useToast } from '../../../hooks/useNotification';

const NotificationStyled = styled(Notification)`
    max-width: 400px;
`;

export const BatteryRechargeNotification: FC<{
    isOpen: boolean;
    onClose: () => void;
    preselectAssetId?: string;
}> = ({ isOpen, onClose, preselectAssetId = TON_ASSET.id }) => {
    const { t } = useTranslation();
    const preselectedAsset = useAsset(preselectAssetId);

    return (
        <NotificationStyled
            isOpen={isOpen}
            handleClose={onClose}
            title={t('battery_recharge_by_crypto_title')}
        >
            {() =>
                !!preselectedAsset && (
                    <BatteryRechargeNotificationContent
                        preselectedAsset={preselectedAsset}
                        onClose={onClose}
                    />
                )
            }
        </NotificationStyled>
    );
};

const ContentWrapper = styled.div``;

const AssetSelectStyled = styled(AssetSelect)`
    margin-bottom: 1rem;
`;

const BatteryCustomAmountInputStyled = styled(BatteryCustomAmountInput)`
    margin-top: 1rem;
    margin-bottom: 8px;
`;

const ButtonResponsiveSizeStyled = styled(ButtonResponsiveSize)`
    margin-top: 16px;
`;

const BatteryRechargeNotificationContent: FC<{
    preselectedAsset: TonAsset;
    onClose: () => void;
}> = ({ preselectedAsset, onClose }) => {
    const [asset, setAsset] = useState(preselectedAsset);
    useEffect(() => {
        setAsset(preselectedAsset);
    }, [preselectedAsset]);

    const [selectedPackType, setSelectedPackType] = useState<string | undefined>();
    const methods = useBatteryAvailableRechargeMethods();
    const packs = useBatteryPacksReservedApplied();
    const [selectedCustomAmount, setSelectedCustomAmount] = useState<{
        tokenValue: BigNumber;
        error: boolean;
    }>({
        tokenValue: new BigNumber(0),
        error: true
    });
    const { t } = useTranslation();
    const [assetAmountToPay, setAssetAmountToPay] = useState<AssetAmount<TonAsset> | undefined>();
    const unitToTonRate = useBatteryUnitTonRate();
    const unitToTokenRate = usePurchaseBatteryUnitTokenRate(legacyTonAssetId(asset));
    const toast = useToast();

    const onCloseNotification = (confirmed?: boolean) => {
        setAssetAmountToPay(undefined);
        if (confirmed) {
            onClose();
            toast(t('battery_please_wait'));
        }
    };

    const onOpenNotification = () => {
        if (!selectedPackType) {
            throw new Error('No pack type selected');
        }
        if (selectedPackType !== 'custom') {
            const packPrice = packs?.find(p => p.type === selectedPackType)?.price;

            if (!unitToTokenRate || !packPrice) {
                throw new Error('Invalid packs data');
            }

            setAssetAmountToPay(
                AssetAmount.fromRelativeAmount({
                    amount: packPrice.relativeAmount
                        .div(unitToTonRate)
                        .multipliedBy(unitToTokenRate),
                    asset: asset
                })
            );
        } else {
            if (selectedCustomAmount.error || selectedCustomAmount.tokenValue.eq(0)) {
                throw new Error('Invalid custom amount');
            }

            setAssetAmountToPay(
                AssetAmount.fromRelativeAmount({ amount: selectedCustomAmount.tokenValue, asset })
            );
        }
    };

    const isContinueDisabled =
        !selectedPackType || (selectedPackType === 'custom' && selectedCustomAmount.error);

    return (
        <ContentWrapper>
            <AssetSelectStyled
                selectedAssetId={asset.id}
                onAssetChange={setAsset}
                allowedAssetsAddresses={methods?.map(m => m.jetton_master || 'TON')}
            />
            <BatteryPacksSelect
                asset={asset}
                selectedPackType={selectedPackType}
                onPackTypeChange={setSelectedPackType}
            />
            <BatteryCustomAmountInputStyled
                asset={asset}
                hidden={selectedPackType !== 'custom'}
                onChange={setSelectedCustomAmount}
            />
            <ButtonResponsiveSizeStyled
                primary
                fullWidth
                disabled={isContinueDisabled}
                onClick={onOpenNotification}
            >
                {t('continue')}
            </ButtonResponsiveSizeStyled>
            <BuyBatteryConfirmNotification
                isOpen={!!assetAmountToPay}
                onClose={onCloseNotification}
                assetAmount={assetAmountToPay}
            />
        </ContentWrapper>
    );
};
