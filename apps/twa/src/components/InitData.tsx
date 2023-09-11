import { useLaunchParams } from '@twa.js/sdk-react';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const InitDataLogger = () => {
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
