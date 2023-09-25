import { useBackButton, useLaunchParams, useMainButton } from '@twa.js/sdk-react';
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

        i18n.languages.forEach(lang => {
            if (launchParams.initData?.user?.languageCode === lang) {
                i18n.reloadResources([lang]).then(() => i18n.changeLanguage(lang));
            }
        });
    }, []);

    // useEffect(() => {
    //     if (launchParams.initData?.user?.username)
    //         sdk.uiEvents.emit('copy', {
    //             method: 'copy',
    //             params: `Welcome ${launchParams.initData?.user.username}`
    //         });
    // }, [launchParams]);

    return <></>;
};
