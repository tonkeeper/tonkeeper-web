import { Notification } from '../../Notification';
import { FC, useState } from 'react';
import { useTranslation } from '../../../hooks/translation';
import styled from 'styled-components';
import { AssetSelect } from '../../fields/AssetSelect';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { BatteryPacksSelect } from './BatteryPacksSelect';
import { useAsset, useAssetWeiBalance } from "../../../state/home";
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { useBatteryAvailableRechargeMethods } from '../../../state/battery';
import { BatteryCustomAmountInput } from './BatteryCustomAmountInput';
import BigNumber from 'bignumber.js';
import { ButtonResponsiveSize } from '../../fields/Button';

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
                    <BatteryRechargeNotificationContent preselectedAsset={preselectedAsset} />
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

const BatteryRechargeNotificationContent: FC<{ preselectedAsset: TonAsset }> = ({
    preselectedAsset
}) => {
    const [asset, setAsset] = useState(preselectedAsset);
    const [selectedPackType, setSelectedPackType] = useState<string | undefined>();
    const methods = useBatteryAvailableRechargeMethods();
    const [selectedCustomAmount, setSelectedCustomAmount] = useState<{
        tokenValue: BigNumber;
        error: boolean;
    }>({
        tokenValue: new BigNumber(0),
        error: true
    });
    const { t } = useTranslation();
    const assetWeiBalance = useAssetWeiBalance(asset);

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
            <ButtonResponsiveSizeStyled primary fullWidth disabled={selectedCustomAmount.error}>
                {t('continue')}
            </ButtonResponsiveSizeStyled>
        </ContentWrapper>
    );
};
