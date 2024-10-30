import { ConfirmView, ConfirmViewTitleSlot } from '../../transfer/ConfirmView';
import { FC } from 'react';
import {
    useEstimatePurchaseBattery,
    usePurchaseBattery
} from '../../../hooks/blockchain/usePurchaseBattery';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { isTon, TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { Notification } from '../../Notification';
import { BATTERY_SENDER_CHOICE, EXTERNAL_SENDER_CHOICE } from '../../../hooks/blockchain/useSender';

export const BuyBatteryConfirmNotification: FC<{
    assetAmount: AssetAmount<TonAsset> | undefined;
    isOpen: boolean;
    onClose: (confirmed?: boolean) => void;
    giftRecipient?: string;
}> = ({ assetAmount, isOpen, onClose, giftRecipient }) => {
    return (
        <Notification isOpen={isOpen} handleClose={() => onClose(false)}>
            {() =>
                !!assetAmount && (
                    <NotificationContent
                        assetAmount={assetAmount}
                        onClose={onClose}
                        giftRecipient={giftRecipient}
                    />
                )
            }
        </Notification>
    );
};

const NotificationContent: FC<{
    assetAmount: AssetAmount<TonAsset>;
    onClose: (confirmed?: boolean) => void;
    giftRecipient?: string;
}> = ({ assetAmount, onClose, giftRecipient }) => {
    const estimation = useEstimatePurchaseBattery({ assetAmount, giftRecipient });

    const mutation = usePurchaseBattery({
        assetAmount,
        estimation: estimation.data!,
        giftRecipient
    });

    const selectedSenderType = isTon(assetAmount.asset.address)
        ? EXTERNAL_SENDER_CHOICE.type
        : BATTERY_SENDER_CHOICE.type;

    return (
        <ConfirmView
            assetAmount={assetAmount}
            onClose={onClose}
            estimation={estimation}
            selectedSenderType={selectedSenderType}
            {...mutation}
        >
            <ConfirmViewTitleSlot />
        </ConfirmView>
    );
};
