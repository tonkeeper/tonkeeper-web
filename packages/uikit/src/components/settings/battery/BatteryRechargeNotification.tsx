import { Notification } from '../../Notification';
import { FC, useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../../hooks/translation';
import styled, { css } from 'styled-components';
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
import { TonRecipientInput } from '../../fields/TonRecipientInput';
import { TonRecipient } from '@tonkeeper/core/dist/entries/send';

const NotificationStyled = styled(Notification)`
    ${p =>
        p.theme.proDisplayType === 'desktop' &&
        css`
            max-width: 400px;
        `}
`;

export const BatteryRechargeNotification: FC<{
    isOpen: boolean;
    onClose: () => void;
    preselectAssetId?: string;
    asGift: boolean;
}> = ({ isOpen, onClose, asGift, preselectAssetId = TON_ASSET.id }) => {
    const { t } = useTranslation();
    const preselectedAsset = useAsset(preselectAssetId);

    return (
        <NotificationStyled
            isOpen={isOpen}
            handleClose={onClose}
            title={t('battery_recharge_by_crypto_title')}
            mobileFullScreen
        >
            {() =>
                !!preselectedAsset && (
                    <BatteryRechargeNotificationContent
                        preselectedAsset={preselectedAsset}
                        onClose={onClose}
                        asGift={asGift}
                    />
                )
            }
        </NotificationStyled>
    );
};

const ContentWrapper = styled.div``;

const AssetSelectStyled = styled(AssetSelect)`
    margin-bottom: 1rem;

    min-height: 52px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    > * {
        flex: 1;
    }
`;

const BatteryCustomAmountInputStyled = styled(BatteryCustomAmountInput)`
    margin-top: 1rem;
    margin-bottom: 8px;
`;

const ButtonResponsiveSizeStyled = styled(ButtonResponsiveSize)`
    margin-top: 16px;
`;

const TonRecipientInputStyled = styled(TonRecipientInput)`
    margin-bottom: 16px;
`;

const BatteryRechargeNotificationContent: FC<{
    preselectedAsset: TonAsset;
    asGift: boolean;
    onClose: () => void;
}> = ({ preselectedAsset, onClose, asGift }) => {
    const [asset, setAsset] = useState(preselectedAsset);
    const unitToTonRate = useBatteryUnitTonRate();
    useEffect(() => {
        setAsset(preselectedAsset);
    }, [preselectedAsset]);

    const [selectedPackId, setSelectedPackId] = useState<string | undefined>();
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
    const unitToTokenRate = usePurchaseBatteryUnitTokenRate(legacyTonAssetId(asset));
    const toast = useToast();

    const onCloseNotification = (confirmed?: boolean) => {
        setAssetAmountToPay(undefined);
        if (confirmed) {
            onClose();
            toast(t('battery_please_wait'));
        }
    };

    const [customReceiver, setCustomReceiver] = useState<{
        isLoading: boolean;
        isErrored: boolean;
        value: TonRecipient | undefined;
    }>({
        isLoading: false,
        isErrored: false,
        value: undefined
    });
    const [formSubmitted, setFormSubmitted] = useState(false);
    const giftInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (asGift && giftInputRef.current) {
            giftInputRef.current.focus();
        }
    }, [asGift]);

    const onOpenNotification = () => {
        if (asGift) {
            if (!customReceiver.value) {
                return setFormSubmitted(true);
            }

            if (customReceiver.isErrored || customReceiver.isLoading) {
                return;
            }
        }

        if (!selectedPackId) {
            throw new Error('No pack type selected');
        }
        if (selectedPackId !== 'custom') {
            const packPrice = packs?.find(p => p.id === selectedPackId)?.price;

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
        !selectedPackId || (selectedPackId === 'custom' && selectedCustomAmount.error);

    return (
        <ContentWrapper>
            {asGift && (
                <TonRecipientInputStyled
                    ref={giftInputRef}
                    onStateChange={setCustomReceiver}
                    isFormSubmitted={formSubmitted}
                />
            )}
            <AssetSelectStyled
                selectedAssetId={asset.id}
                onAssetChange={setAsset}
                allowedAssetsAddresses={methods?.map(m => m.jettonMaster || 'TON')}
            />
            <BatteryPacksSelect
                asset={asset}
                selectedPackId={selectedPackId}
                onPackIdChange={setSelectedPackId}
            />
            <BatteryCustomAmountInputStyled
                asset={asset}
                hidden={selectedPackId !== 'custom'}
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
                giftRecipient={asGift ? customReceiver.value?.address : undefined}
            />
        </ContentWrapper>
    );
};
