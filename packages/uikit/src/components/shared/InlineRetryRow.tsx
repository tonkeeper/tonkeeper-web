import { FC } from 'react';

import { Button } from '../../primitives';
import { cn } from '../../libs/css';
import { useTranslation } from '../../hooks/translation';
import IcRefresh16 from '../../icons/components/IcRefresh16';

/**
 * Non-blocking failure notice for content that is partly on screen already:
 * the footer of a paginated list whose next page failed, or a section whose
 * data arrived incomplete. The rows around it stay untouched — a later
 * cursor failing must never take the pages already loaded with it.
 */
export const InlineRetryRow: FC<{
    /** Defaults to the paginated-list wording. */
    text?: string;
    onRetry: () => void;
    className?: string;
}> = ({ text, onRetry, className }) => {
    const { t } = useTranslation();

    return (
        <div className={cn('flex items-center justify-between gap-3 px-4 py-3', className)}>
            <span className="min-w-0 flex-1 text-body2 text-textSecondary">
                {text ?? t('load_more_error')}
            </span>
            <Button
                variant="tertiary"
                size="small"
                leftIcon={<IcRefresh16 className="size-4" />}
                onClick={onRetry}
            >
                {t('retry')}
            </Button>
        </div>
    );
};
