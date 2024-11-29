import React, { FC, useMemo } from 'react';
import { Notification } from '../../Notification';
import {
    ConfirmView,
    ConfirmViewHeading,
    ConfirmViewHeadingSlot,
    ConfirmViewTitleSlot
} from '../../transfer/ConfirmView';
import { useSendTwoFADeploy } from '../../../hooks/blockchain/two-fa/useSendTwoFADeploy';
import { useEstimateTwoFADeploy } from '../../../hooks/blockchain/two-fa/useEstimateTwoFADeploy';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TwoFAEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/2fa-encoder';
import { useTranslation } from '../../../hooks/translation';

export const DeployTwoFAConfirmNotification: FC<{
    isOpen: boolean;
    onClose: (confirmed?: boolean) => void;
}> = ({ isOpen, onClose }) => {
    return (
        <Notification isOpen={isOpen} handleClose={() => onClose(false)}>
            {() => <NotificationContent onClose={onClose} />}
        </Notification>
    );
};

const NotificationContent: FC<{
    onClose: (confirmed?: boolean) => void;
}> = ({ onClose }) => {
    const { t } = useTranslation();
    const estimation = useEstimateTwoFADeploy();

    const mutation = useSendTwoFADeploy(estimation.data!);

    const assetAmount = useMemo(() => {
        return new AssetAmount({
            asset: TON_ASSET,
            weiAmount: TwoFAEncoder.deployPluginValue.toString()
        });
    }, []);

    return (
        <ConfirmView
            assetAmount={assetAmount}
            onClose={onClose}
            estimation={estimation}
            {...mutation}
        >
            <ConfirmViewTitleSlot />
            <ConfirmViewHeadingSlot>
                <ConfirmViewHeading title={t('two_fa_settings_set_up_deploy_step_button')} />
            </ConfirmViewHeadingSlot>
        </ConfirmView>
    );
};
