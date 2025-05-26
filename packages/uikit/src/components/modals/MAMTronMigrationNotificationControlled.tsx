import { Notification } from '../Notification';
import { createModalControl } from './createModalControl';
import React, { useCallback } from 'react';
import { useTranslation } from '../../hooks/translation';
import { useAtom } from '../../libs/useAtom';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';

const { hook, paramsControl } = createModalControl<{
    address: string;
    usdtBalance: AssetAmount;
}>();

export const useMamTronMigrationNotification = hook;

export const MAMTronMigrationNotification = () => {
    const { isOpen, onClose } = useMamTronMigrationNotification();
    const { t } = useTranslation();
    const [params] = useAtom(paramsControl);

    const Content = useCallback(() => {
        if (!params?.address) {
            return null;
        }

        return (
            <div>
                You have unused balance in your wallet: {params.address}
                {params.usdtBalance.stringAssetRelativeAmount}
            </div>
        );
    }, [onClose, params]);

    return (
        <Notification isOpen={isOpen} handleClose={onClose} title={t('Warning')} mobileFullScreen>
            {Content}
        </Notification>
    );
};
