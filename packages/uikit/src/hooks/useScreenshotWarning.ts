import { useEffect } from 'react';
import { useAppSdk } from './appSdk';
import { useTranslation } from './translation';

export const useScreenshotWarning = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();

    useEffect(
        () => sdk.screenshotTaken?.subscribe(() => sdk.topMessage(t('screenshot_warning_seed'))),
        [sdk, t]
    );
};
