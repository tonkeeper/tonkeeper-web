import { FC } from 'react';

import { Modal } from '../../../primitives/Modal';
import { Switch } from '../../../primitives';
import { cn } from '../../../libs/css';
import { useTranslation } from '../../../hooks/translation';
import IcSliders16 from '../../../icons/components/IcSliders16';

/**
 * The "Filters" entry figure: the same 32px secondary circle as
 * BackButton / CloseButton, with the sliders glyph both natives use.
 * Positioning belongs to the header or row that hosts it.
 */
export const FiltersButton: FC<{ onClick: () => void; className?: string }> = ({
    onClick,
    className
}) => {
    const { t } = useTranslation();

    return (
        <button
            type="button"
            aria-label={t('filters')}
            onClick={onClick}
            className={cn(
                'flex size-8 cursor-pointer items-center justify-center rounded-medium bg-buttonSecondaryBackground text-buttonSecondaryForeground transition-colors duration-100 hover:bg-buttonSecondaryBackgroundHighlighted',
                className
            )}
        >
            <IcSliders16 className="size-4" />
        </button>
    );
};

export interface MultichainFilterToggle {
    title: string;
    subtitle: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

/**
 * The Filters bottom sheet both natives open from the history and
 * Manage Crypto top bars: a list of switch rows, one per filter. The
 * toggles apply immediately — the sheet has no confirm step.
 */
export const MultichainFiltersSheet: FC<{
    isOpen: boolean;
    onClose: () => void;
    toggles: MultichainFilterToggle[];
}> = ({ isOpen, onClose, toggles }) => {
    const { t } = useTranslation();

    return (
        <Modal isOpen={isOpen} onClose={onClose} variant="content" topBarTitle={t('filters')}>
            <div className="flex flex-col gap-2 pb-2">
                {toggles.map(toggle => (
                    <div
                        key={toggle.title}
                        className="flex items-center gap-4 rounded-medium bg-backgroundContent p-4"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="text-label1 text-textPrimary">{toggle.title}</p>
                            <p className="text-body2 text-textSecondary">{toggle.subtitle}</p>
                        </div>
                        <Switch checked={toggle.checked} onChange={toggle.onChange} />
                    </div>
                ))}
            </div>
        </Modal>
    );
};
