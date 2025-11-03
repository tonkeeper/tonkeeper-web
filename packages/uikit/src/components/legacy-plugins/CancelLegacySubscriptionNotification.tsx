import { FC, useCallback, useEffect } from 'react';
import { Notification } from '../Notification';
import { ConfirmView, ConfirmViewHeading, ConfirmViewHeadingSlot } from '../transfer/ConfirmView';
import {
    useCancelSubscription,
    useEstimateRemoveExtension
} from '../../hooks/blockchain/subscription';
import { useActiveWallet } from '../../state/wallet';
import { isStandardTonWallet, WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { toNano } from '@ton/core';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';

export const CancelLegacySubscriptionNotification: FC<{
    onClose: () => void;
    pluginAddress: string | undefined;
}> = ({ onClose, pluginAddress }) => {
    return (
        <Notification isOpen={!!pluginAddress} handleClose={onClose} hideButton>
            {() =>
                !!pluginAddress && (
                    <CancelLegacySubscription onClose={onClose} pluginAddress={pluginAddress} />
                )
            }
        </Notification>
    );
};

const destroyValue = toNano(0.05).toString();
const assetAmount = new AssetAmount({ weiAmount: destroyValue, asset: TON_ASSET });

const CancelLegacySubscription: FC<{ pluginAddress: string; onClose: () => void }> = ({
    pluginAddress,
    onClose
}) => {
    const wallet = useActiveWallet();
    const estimation = useEstimateRemoveExtension();
    const unsubscribeMutation = useCancelSubscription();
    const sdk = useAppSdk();
    const { t } = useTranslation();

    const unsubscribeCallback = useCallback(() => {
        if (!isStandardTonWallet(wallet) || wallet.version !== WalletVersion.V4R2) {
            throw new Error('Unexpected wallet is used to unsubscribe from legacy subscription');
        }

        return unsubscribeMutation
            .mutateAsync({
                selectedWallet: wallet,
                extensionContract: pluginAddress,
                destroyValue
            })
            .then(succeed => {
                if (succeed) {
                    sdk.topMessage(t('unsubscribe_legacy_plugin_success_toast'));
                }
                return !!succeed;
            });
    }, [wallet, pluginAddress, t]);

    useEffect(() => {
        if (!isStandardTonWallet(wallet) || wallet.version !== WalletVersion.V4R2) {
            console.error('Unexpected wallet is used to unsubscribe from legacy subscription');
            return onClose();
        }
        estimation.mutate({
            selectedWallet: wallet,
            extensionContract: pluginAddress,
            destroyValue
        });
    }, []);

    return (
        <ConfirmView
            assetAmount={assetAmount}
            onClose={onClose}
            estimation={estimation}
            {...unsubscribeMutation}
            mutateAsync={unsubscribeCallback}
        >
            <ConfirmViewHeadingSlot>
                <ConfirmViewHeading
                    title={t('cancel_subscription')}
                    caption={t('confirm_action')}
                />
            </ConfirmViewHeadingSlot>
        </ConfirmView>
    );
};
