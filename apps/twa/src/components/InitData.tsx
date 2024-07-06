import { useBackButton, useLaunchParams, useMainButton } from '@tma.js/sdk-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const InitDataLogger = () => {
    const launchParams = useLaunchParams();
    const { t, i18n } = useTranslation();
    const button = useMainButton();
    const backButton = useBackButton();

    useEffect(() => {
        button.hide();
        backButton.hide();
    }, []);

    useEffect(() => {
        if (launchParams.initData?.user?.languageCode) {
            i18n.languages.forEach(lang => {
                if (launchParams.initData?.user?.languageCode === lang) {
                    i18n.reloadResources([lang]).then(() => i18n.changeLanguage(lang));
                }
            });
        }
    }, [launchParams.initData?.user?.languageCode]);

    // useEffect(() => {
    //     if (launchParams.initData?.user?.username)
    //         sdk.uiEvents.emit('copy', {
    //             method: 'copy',
    //             params: `Welcome ${launchParams.initData?.user.username}`
    //         });
    // }, [launchParams]);

    return <></>;
};
