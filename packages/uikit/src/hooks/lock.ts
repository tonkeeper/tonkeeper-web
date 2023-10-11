import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useEffect, useState } from 'react';

export const useLock = (sdk: IAppSdk) => {
    const [lock, setLock] = useState<boolean | undefined>(undefined);
    useEffect(() => {
        sdk.storage.get<boolean>(AppKey.LOCK).then(useLock => setLock(useLock === true));

        const unlock = () => {
            setLock(false);
        };
        sdk.uiEvents.on('unlock', unlock);

        return () => {
            sdk.uiEvents.off('unlock', unlock);
        };
    }, []);
    return lock;
};
