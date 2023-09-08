import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useLaunchParams, useSDK } from '@twa.js/sdk-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const Watcher = () => {
    const sdk = useAppSdk();
    const launchParams = useLaunchParams();
    const { t, i18n } = useTranslation();

    useEffect(() => {
        i18n.languages.forEach(lang => {
            if (launchParams.initData?.user?.languageCode === lang) {
                i18n.changeLanguage(lang);
            }
        });
    }, [launchParams]);

    // useEffect(() => {
    //     if (launchParams.initData?.user?.username)
    //         sdk.uiEvents.emit('copy', {
    //             method: 'copy',
    //             params: `Welcome ${launchParams.initData?.user.username}`
    //         });
    // }, [launchParams]);

    return <></>;
};

export const InitDataLogger = () => {
    const { didInit, components } = useSDK();

    if (didInit && components) {
        return <Watcher />;
    } else {
        return <></>;
    }
};
