import { FC } from 'react';

import { Button } from '../../../../primitives';
import { useTranslation } from '../../../../hooks/translation';
import IcClock56 from '../../../../icons/components/IcClock56';

/**
 * Empty feed. Unfiltered, it is the first-run state: nothing ever happened,
 * so it prompts to add funds. Filtered (chain, type, asset, or dust filter
 * active), it says the filters matched nothing and offers no CTA — the
 * wallet has history, just not here. Both natives make the same split.
 */
export const MultichainHistoryEmptyState: FC<{
    onAddFunds?: () => void;
    filtered?: boolean;
}> = ({ onAddFunds, filtered = false }) => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center px-8 text-center">
            <IcClock56 className="mb-4 size-14 text-accentBlue" />
            <h3 className="text-h3 text-textPrimary">
                {t(
                    filtered
                        ? 'multichain_history_filtered_empty_title'
                        : 'multichain_history_empty_title'
                )}
            </h3>
            <p className="mt-1 text-body1 text-textSecondary">
                {t(
                    filtered
                        ? 'multichain_history_filtered_empty_subtitle'
                        : 'multichain_history_empty_subtitle'
                )}
            </p>
            {!filtered && (
                <Button variant="secondary" size="small" className="mt-6" onClick={onAddFunds}>
                    {t('wallet_add_funds')}
                </Button>
            )}
        </div>
    );
};
