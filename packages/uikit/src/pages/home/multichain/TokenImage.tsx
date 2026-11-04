import { FC, ReactNode, useState } from 'react';

import { isPlaceholderTokenImage } from '@tonkeeper/core/dist/service/multichainWalletService';

import { useIsSkeleton, useSkeletonMask } from '../../../primitives';
import { cn } from '../../../libs/css';

const TokenPlaceholderGlyph = () => (
    <svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" className="size-full">
        <rect width="44" height="44" rx="22" className="fill-backgroundContentTint" />
        <path
            d="M23.9454 16.9531C24.6906 16.0311 26.0705 15.9583 26.9083 16.7969L36.881 26.7852C38.1355 28.0423 37.2459 30.1899 35.4698 30.1904H17.4239C17.3175 30.1904 17.2135 30.182 17.1134 30.167H9.42588C8.17873 30.167 7.53479 28.6765 8.38975 27.7686L15.0626 20.6826C15.6538 20.0548 16.6631 20.093 17.2052 20.7637L19.0343 23.0273L23.9454 16.9531ZM15.5108 10C17.4755 10 19.0685 11.593 19.0685 13.5576C19.0683 15.5221 17.4754 17.1143 15.5108 17.1143C13.5464 17.1142 11.9534 15.5221 11.9532 13.5576C11.9532 11.593 13.5462 10 15.5108 10Z"
            className="fill-iconTertiary"
        />
    </svg>
);

/**
 * Token thumbnail with graceful degradation. Renders the remote image when
 * it loads; otherwise the caller's `fallback` (the local chain icon) — the
 * balances backend deliberately returns `image: ""` for native coins, and
 * the swaps backend can point at URLs that no longer serve an image; and
 * the placeholder glyph when there is no fallback either — token images
 * point at a cache that doesn't guarantee the source still exists, so 404s
 * are routine and would otherwise render the browser's broken-image icon.
 *
 * The backend's own placeholder art (a small raster it hands out for tokens
 * without an icon) is never shown: it is blurry on retina screens, and it
 * means "no image", so the glyph is drawn instead — not the fallback, which
 * would pass a nameless token off as the chain's native coin.
 */
export const TokenImage: FC<{
    src?: string;
    fallback?: ReactNode;
    className?: string;
}> = ({ src, fallback, className }) => {
    const [erroredSrc, setErroredSrc] = useState<string>();
    const isSkeleton = useIsSkeleton();
    const mask = useSkeletonMask();

    // A mask bar is a pseudo-element, which `<img>` cannot host, so the
    // skeleton renders its own box rather than masking whatever branch below
    // would have won. The caller's background is forced off: it would sit as
    // a square behind the circular bar.
    if (isSkeleton) {
        return (
            <span
                {...mask({ w: '100%', h: '100%', r: 'var(--tk-rounding-full)' })}
                className={cn('block !bg-transparent', className)}
            />
        );
    }

    if (isPlaceholderTokenImage(src)) {
        return <PlaceholderBox className={className} />;
    }

    if (src && src !== erroredSrc) {
        return (
            <img
                src={src}
                alt=""
                onError={() => setErroredSrc(src)}
                className={cn('rounded-full object-cover', className)}
            />
        );
    }
    if (fallback) {
        return (
            <span
                className={cn(
                    'flex items-center justify-center overflow-hidden rounded-full [&>svg]:size-full',
                    className
                )}
            >
                {fallback}
            </span>
        );
    }
    return <PlaceholderBox className={className} />;
};

const PlaceholderBox: FC<{ className?: string }> = ({ className }) => (
    <span
        data-testid="token-image-placeholder"
        className={cn('block overflow-hidden rounded-full', className)}
    >
        <TokenPlaceholderGlyph />
    </span>
);
