import { FC, useEffect, useRef, useState } from 'react';

import { FireIcon } from '../../../../components/Icon';
import { useTranslation } from '../../../../hooks/translation';
import IcEllipsis16 from '../../../../icons/components/IcEllipsis16';
import IcEyeDisable16 from '../../../../icons/components/IcEyeDisable16';
import IcGlobe16 from '../../../../icons/components/IcGlobe16';

/** Overflow actions shown in the NFT details header, matching the native app. */
export const MultichainNftMenu: FC<{
    hideCollection: boolean;
    canBurn: boolean;
    onHide: () => void;
    onViewOnExplorer: () => void;
    onBurn: () => void;
}> = ({ hideCollection, canBurn, onHide, onViewOnExplorer, onBurn }) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (event: MouseEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown, true);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown, true);
        };
    }, [open]);

    const run = (action: () => void) => {
        setOpen(false);
        action();
    };
    const itemClass =
        'flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors duration-100 hover:bg-backgroundHighlighted';
    const iconClass = 'size-4 shrink-0 text-accentBlue';

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                aria-label={t('wallet_asset_more')}
                aria-expanded={open}
                onClick={() => setOpen(value => !value)}
                className="flex size-8 cursor-pointer items-center justify-center rounded-medium bg-buttonSecondaryBackground text-buttonSecondaryForeground transition-colors duration-100 hover:bg-buttonSecondaryBackgroundHighlighted"
            >
                <IcEllipsis16 className="size-4" />
            </button>

            {open && (
                <div className="absolute right-0 top-full z-30 mt-1 w-[220px] overflow-hidden rounded-2xl bg-backgroundContentTint shadow-[0_4px_16px_rgba(0,0,0,0.04),0_16px_64px_rgba(0,0,0,0.08)]">
                    <button type="button" onClick={() => run(onHide)} className={itemClass}>
                        <span className="min-w-0 flex-1 text-label1 text-textPrimary">
                            {hideCollection
                                ? t('multichain_nft_hide_collection')
                                : t('multichain_nft_hide_nft')}
                        </span>
                        <IcEyeDisable16 className={iconClass} />
                    </button>
                    <button
                        type="button"
                        onClick={() => run(onViewOnExplorer)}
                        className={itemClass}
                    >
                        <span className="min-w-0 flex-1 text-label1 text-textPrimary">
                            {t('multichain_nft_view_on_tonviewer')}
                        </span>
                        <IcGlobe16 className={iconClass} />
                    </button>
                    {canBurn && (
                        <button type="button" onClick={() => run(onBurn)} className={itemClass}>
                            <span className="min-w-0 flex-1 text-label1 text-textPrimary">
                                {t('multichain_nft_burn')}
                            </span>
                            <FireIcon className={iconClass} color="accentBlue" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
