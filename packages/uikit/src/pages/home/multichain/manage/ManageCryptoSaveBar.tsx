import { FC } from 'react';

import { Button } from '../../../../primitives';
import { useTranslation } from '../../../../hooks/translation';

/**
 * Sits in flow at the bottom of the modal column, pulled up over the
 * token list by the negative top margin (same treatment as the desktop
 * tab bar) so the list scrolls behind the blur with no gap.
 */
export const ManageCryptoSaveBar: FC<{
    onSave: () => void;
    isSaving: boolean;
    /** Desktop modal — no home-indicator spacer below the button. */
    compact?: boolean;
}> = ({ onSave, isSaving, compact = false }) => {
    const { t } = useTranslation();

    return (
        <div className="relative z-10 -mt-11 shrink-0 bg-backgroundTransparent backdrop-blur">
            <div className="flex w-full items-center px-4 py-4">
                <Button
                    variant="primaryBlue"
                    size="large"
                    fullWidth
                    loading={isSaving}
                    onClick={onSave}
                >
                    {t('save_changes')}
                </Button>
            </div>
            {!compact && <div className="h-[21px]" />}
        </div>
    );
};
