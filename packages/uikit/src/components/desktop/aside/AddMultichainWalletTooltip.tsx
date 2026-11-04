import { FC, ReactNode, useEffect, useRef } from 'react';

import { useTranslation } from '../../../hooks/translation';
import { useAddMultichainWalletTooltip } from '../../../state/multichain/useAddMultichainWalletTooltip';

/**
 * Anchors the "NEW — Add a multichain wallet" bubble above the
 * sidebar's add-wallet control (the `children`). The bubble is itself a
 * shortcut to that control; a click on the control, the bubble, or
 * anywhere outside closes it. Visibility and the show budget live in
 * `useAddMultichainWalletTooltip`.
 */
export const AddMultichainWalletTooltip: FC<{
    children: ReactNode;
    onOpenAddWallet: () => void;
}> = ({ children, onOpenAddWallet }) => {
    const { t } = useTranslation();
    const { visible, dismiss } = useAddMultichainWalletTooltip();
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!visible) return;
        const onPress = (e: MouseEvent) => {
            if (!wrapperRef.current?.contains(e.target as Node)) dismiss();
        };
        document.addEventListener('mousedown', onPress);
        return () => document.removeEventListener('mousedown', onPress);
    }, [visible, dismiss]);

    // Dismissal runs in the bubble phase: a capture-phase dismiss would
    // unmount the bubble before its own click handler gets to run.
    return (
        <div ref={wrapperRef} className="relative w-full" onClick={dismiss}>
            {children}
            {visible && (
                <button
                    type="button"
                    onClick={onOpenAddWallet}
                    className="absolute bottom-full left-0 z-30 mb-2 flex max-w-full cursor-pointer items-start gap-1.5 rounded-xl bg-accentBlueConstant px-3 py-2 text-left"
                >
                    <span className="absolute -bottom-1 left-4 size-2 rotate-45 bg-accentBlueConstant" />
                    <span className="mt-px shrink-0 rounded-md bg-white px-1.5 py-0.5 text-label3 text-accentBlueConstant">
                        {t('wallet_asset_favorites_new_badge')}
                    </span>
                    <span className="text-label2 text-white">
                        {t('tooltip_add_multichain_wallet')}
                    </span>
                </button>
            )}
        </div>
    );
};
