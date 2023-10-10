import { ReceiveInitParams } from '@tonkeeper/core/dist/AppSdk';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { ReceiveContent } from '@tonkeeper/uikit/dist/components/home/AccountView';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { FC, PropsWithChildren, useEffect, useState } from 'react';
import { useHandleBackButton } from '../libs/twaHooks';

const Content: FC<{
    chain?: BLOCKCHAIN_NAME | undefined;
    jetton?: string | undefined;
    handleClose: () => void;
}> = ({ chain, jetton, handleClose }) => {
    useHandleBackButton(handleClose);
    return <ReceiveContent chain={chain} jetton={jetton} />;
};

export const TwaReceiveNotification: FC<PropsWithChildren> = ({ children }) => {
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

    if (params) {
        return <Content chain={params.chain} jetton={params.jetton} handleClose={handleClose} />;
    } else {
        return <>{children}</>;
    }
};
