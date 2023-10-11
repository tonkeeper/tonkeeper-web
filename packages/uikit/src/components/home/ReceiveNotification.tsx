import { ReceiveInitParams } from '@tonkeeper/core/dist/AppSdk';
import React, { useCallback, useEffect, useState } from 'react';
import { useAppSdk } from '../../hooks/appSdk';
import { Notification } from '../Notification';
import { ReceiveContent } from './AccountView';

const ReceiveNotification = () => {
    const sdk = useAppSdk();
    const [params, setParams] = useState<ReceiveInitParams | undefined>(undefined);

    const handleClose = () => {
        setParams(undefined);
    };

    useEffect(() => {
        const handler = (options: {
            method: 'receive';
            id?: number | undefined;
            params: ReceiveInitParams;
        }) => {
            setParams(options.params);
        };

        sdk.uiEvents.on('receive', handler);
        return () => {
            sdk.uiEvents.off('receive', handler);
        };
    }, []);

    const Content = useCallback(() => {
        if (!params) return undefined;
        return (
            <ReceiveContent chain={params.chain} jetton={params.jetton} handleClose={handleClose} />
        );
    }, [params, handleClose]);

    return (
        <Notification isOpen={params != undefined} handleClose={handleClose} backShadow hideButton>
            {Content}
        </Notification>
    );
};

export default ReceiveNotification;
