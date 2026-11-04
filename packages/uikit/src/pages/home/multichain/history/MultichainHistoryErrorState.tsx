import { FC } from 'react';

import { Button } from '../../../../primitives';
import { useTranslation } from '../../../../hooks/translation';
import IcClock56 from '../../../../icons/components/IcClock56';

/**
 * Terminal-error state for the activity feed. The query has retries disabled,
 * so a failure is final — offer a manual retry rather than silently rendering
 * the empty-wallet prompt.
 */
export const MultichainHistoryErrorState: FC<{ onRetry: () => void }> = ({ onRetry }) => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center px-8 text-center">
            <IcClock56 className="mb-4 size-14 text-textSecondary" />
            <h3 className="text-h3 text-textPrimary">{t('error_occurred')}</h3>
            <p className="mt-1 text-body1 text-textSecondary">{t('please_try_again_later')}</p>
            <Button variant="secondary" size="small" className="mt-6" onClick={onRetry}>
                {t('try_again')}
            </Button>
        </div>
    );
};
