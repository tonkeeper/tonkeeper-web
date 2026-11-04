import { FC, useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../../../hooks/translation';

import { AssetDetailsAbout } from '@tonkeeper/core/dist/service/tradingService';

import { cn } from '../../../../libs/css';
import { ListTitle } from '../ListTitle';

export const MultichainAssetAbout: FC<{ about: AssetDetailsAbout }> = ({ about }) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    // "More" appears only when the 3-line clamp actually cuts the text off —
    // measured (and re-measured on width changes) rather than guessed from
    // string length, since wrapping depends on the column width.
    const [clamped, setClamped] = useState(false);
    const textRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        const el = textRef.current;
        if (!el || expanded) return;
        const measure = () => setClamped(el.scrollHeight > el.clientHeight + 1);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [about.text, expanded]);

    if (!about.enabled || !about.text) {
        return null;
    }

    return (
        <section className="flex flex-col px-4 pb-4">
            <ListTitle title={t('wallet_asset_about')} />
            <div className="overflow-hidden rounded-medium bg-backgroundContent px-4 pb-3 pt-4">
                <p
                    ref={textRef}
                    className={cn('text-body2 text-textPrimary', !expanded && 'line-clamp-3')}
                >
                    {about.text}
                </p>
                {!expanded && clamped && (
                    <button
                        type="button"
                        onClick={() => setExpanded(true)}
                        className="mt-1 cursor-pointer text-body2 text-textAccent transition-opacity duration-100 hover:opacity-80"
                    >
                        {t('wallet_asset_more')}
                    </button>
                )}
            </div>
        </section>
    );
};
