import { useEffect } from 'react';
import { useTranslation } from '../../hooks/translation';
import { useNotifyError, useToast } from '../../hooks/useNotification';
import { useResumeProTrialMutation } from '../../state/pro';

/**
 * For a shell whose Telegram login takes the whole tab: once the app is back,
 * activates the trial the tab left for. Renders nothing.
 */
export const ProTrialTelegramReturn = () => {
    const { t } = useTranslation();
    const toast = useToast();
    const { mutateAsync, error } = useResumeProTrialMutation();
    useNotifyError(error);

    useEffect(() => {
        mutateAsync().then(
            resumed => resumed && toast(t('aside_pro_trial_is_active')),
            () => undefined
        );
        // Once per page load: the pending login is read and cleared on the first run.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
};
