import { ConfirmView, ConfirmViewTitleSlot } from '../../transfer/ConfirmView';
import { FC } from 'react';
import {
    useEstimatePurchaseBattery,
    usePurchaseBattery
} from '../../../hooks/blockchain/usePurchaseBattery';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { Notification } from '../../Notification';

export const BuyBatteryConfirmNotification: FC<{
    assetAmount: AssetAmount<TonAsset> | undefined;
    isOpen: boolean;
    onClose: (confirmed?: boolean) => void;
}> = ({ assetAmount, isOpen, onClose }) => {
    return (
        <Notification isOpen={isOpen} handleClose={() => onClose(false)}>
            {() =>
                !!assetAmount && <NotificationContent assetAmount={assetAmount} onClose={onClose} />
            }
        </Notification>
    );
};

const NotificationContent: FC<{
    assetAmount: AssetAmount<TonAsset>;
    onClose: (confirmed?: boolean) => void;
}> = ({ assetAmount, onClose }) => {
    const estimation = useEstimatePurchaseBattery(assetAmount);
    const mutation = usePurchaseBattery({ assetAmount, estimation: estimation.data! });

    return (
        <ConfirmView
            assetAmount={assetAmount}
            onClose={onClose}
            estimation={estimation}
            {...mutation}
        >
            <ConfirmViewTitleSlot />
        </ConfirmView>
    );
};
