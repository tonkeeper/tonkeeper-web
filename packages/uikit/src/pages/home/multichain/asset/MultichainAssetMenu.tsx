import { FC, useEffect, useRef, useState } from 'react';

import { formatAddress } from '@tonkeeper/core/dist/utils/common';

import { ExternalLink } from '../../../../components/shared/ExternalLink';
import { useTranslation } from '../../../../hooks/translation';
import IcEllipsis16 from '../../../../icons/components/IcEllipsis16';
import IcEye16 from '../../../../icons/components/IcEye16';
import IcEyeDisable16 from '../../../../icons/components/IcEyeDisable16';
import IcGlobe16 from '../../../../icons/components/IcGlobe16';
import {
    isAssetVisible,
    usePendingAssetVisibility,
    useSetAssetVisibility
} from '../../../../state/multichain/useMultichainAssetVisibility';
import { useActiveAccount, useActiveConfig, useActiveTonNetwork } from '../../../../state/wallet';
import { assetExplorerLink } from '../multichain-utils';

/**
 * Asset-page "…" menu (Figma action sheet 3341:127251): explorer link plus
 * the Hide-from / Show-in-Wallet toggle, reading the same backend visibility
 * the home portfolio does. `onVisibilityChange` fires as soon as the choice
 * is recorded so the page can raise the confirmation toast.
 */
export const MultichainAssetMenu: FC<{
    assetId: string;
    /** The asset's backend visibility, before any pending local override. */
    isHidden?: boolean;
    onVisibilityChange?: (hidden: boolean) => void;
}> = ({ assetId, isHidden: savedHidden = false, onVisibilityChange }) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const pendingVisibility = usePendingAssetVisibility();
    const { mutateAsync: setVisibility } = useSetAssetVisibility();
    const isHidden = !isAssetVisible({ assetId, isHidden: savedHidden }, pendingVisibility);
    const { explorers } = useActiveConfig();
    const account = useActiveAccount();
    const network = useActiveTonNetwork();
    const explorer = assetExplorerLink(
        assetId,
        explorers,
        formatAddress(account.activeTonWallet.rawAddress, network)
    );

    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    const toggleHidden = async () => {
        setOpen(false);
        onVisibilityChange?.(!isHidden);
        try {
            await setVisibility([{ assetId, visible: isHidden }]);
        } catch {
            // Swallow — the choice is persisted locally either way and goes
            // up again with the next one.
        }
    };

    const itemClass =
        'flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left transition-colors duration-100 hover:bg-backgroundHighlighted';
    const labelClass = 'min-w-0 flex-1 truncate text-label1 text-textPrimary';

    return (
        <div ref={wrapperRef} className="relative">
            <button
                aria-label={t('wallet_asset_more')}
                onClick={() => setOpen(o => !o)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-medium bg-buttonSecondaryBackground text-iconTertiary transition-colors duration-100 hover:bg-buttonSecondaryBackgroundHighlighted hover:text-iconSecondary"
            >
                <IcEllipsis16 className="size-4" />
            </button>
            {open && (
                <div className="absolute right-0 top-full z-30 mt-1 w-[220px] overflow-hidden rounded-2xl bg-backgroundContentTint shadow-[0_4px_16px_rgba(0,0,0,0.04),0_16px_64px_rgba(0,0,0,0.08)]">
                    {explorer && (
                        <>
                            <ExternalLink
                                href={explorer.url}
                                onClick={() => setOpen(false)}
                                contents
                            >
                                <span className={itemClass}>
                                    <span className={labelClass}>
                                        {t('wallet_asset_view_on_explorer', {
                                            explorer: explorer.name
                                        })}
                                    </span>
                                    <IcGlobe16 className="size-4 shrink-0 text-iconSecondary" />
                                </span>
                            </ExternalLink>
                            <div className="ml-4 h-[0.5px] bg-separatorCommon" />
                        </>
                    )}
                    <button type="button" onClick={toggleHidden} className={itemClass}>
                        <span className={labelClass}>
                            {isHidden
                                ? t('wallet_asset_show_in_wallet')
                                : t('wallet_asset_hide_from_wallet')}
                        </span>
                        {isHidden ? (
                            <IcEye16 className="size-4 shrink-0 text-iconSecondary" />
                        ) : (
                            <IcEyeDisable16 className="size-4 shrink-0 text-iconSecondary" />
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};
