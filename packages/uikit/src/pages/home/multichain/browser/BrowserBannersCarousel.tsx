import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { BrowserApp } from '@tonkeeper/core/dist/service/browserCatalogService';

import { useIsFullWidthMode } from '../../../../hooks/useIsFullWidthMode';
import { useActiveConfig } from '../../../../state/wallet';
import { cn } from '../../../../libs/css';
import IcChevronLeft16 from '../../../../icons/components/IcChevronLeft16';
import IcChevronRight16 from '../../../../icons/components/IcChevronRight16';

const CARD_GAP = 8;

const cardStep = (el: HTMLElement) => {
    const card = el.firstElementChild as HTMLElement | null;
    return card ? card.offsetWidth + CARD_GAP : el.clientWidth;
};

/* Figma's eased gradient baked into explicit stops: [position %, alpha]. */
const EDGE_FADE_STOPS: [number, number][] = [
    [0, 1],
    [6.67, 0.991],
    [13.33, 0.964],
    [20, 0.918],
    [26.67, 0.853],
    [33.33, 0.768],
    [40, 0.668],
    [46.67, 0.557],
    [53.33, 0.443],
    [60, 0.332],
    [66.67, 0.232],
    [73.33, 0.147],
    [80, 0.082],
    [86.67, 0.036],
    [93.33, 0.009],
    [100, 0]
];

const edgeFadeStyle = (direction: 'to left' | 'to right') => {
    const mask = `linear-gradient(${direction}, ${EDGE_FADE_STOPS.map(
        ([position, alpha]) => `rgba(0, 0, 0, ${alpha}) ${position}%`
    ).join(', ')})`;
    return { WebkitMaskImage: mask, maskImage: mask };
};

const EDGE_FADE_LEFT_STYLE = edgeFadeStyle('to right');
const EDGE_FADE_RIGHT_STYLE = edgeFadeStyle('to left');

/**
 * Poster carousel at the top of the Explore tab: scroll-snapped cards with
 * the neighbors peeking (a narrow sliver on mobile, 73px on desktop). The
 * caption cell sits on a bottom gradient so the white text stays readable on
 * any poster. On desktop, page-colored fades cover both edges so the peeking
 * neighbors blend into the background, and hover reveals navigation arrows.
 *
 * Loops infinitely when there is more than one banner: the slide list is
 * tripled, scrolling starts on the middle copy, and once scrolling settles
 * inside the first or last copy the position is silently shifted back by one
 * set-width — the jump lands on the identical slide, so it is invisible.
 *
 * Auto-advances on the backend-configured `featured_play_interval`, pausing
 * while the pointer is over the carousel.
 */
export const BrowserBannersCarousel: FC<{
    banners: BrowserApp[];
    onOpenApp: (app: BrowserApp) => void;
}> = ({ banners, onOpenApp }) => {
    const isDesktop = useIsFullWidthMode();
    const autoplayInterval = useActiveConfig().featured_play_interval;
    const scrollerRef = useRef<HTMLDivElement>(null);
    const settleTimer = useRef<ReturnType<typeof setTimeout>>();
    const pausedRef = useRef(false);

    const loop = banners.length > 1;
    const slides = useMemo(
        () =>
            (loop ? [0, 1, 2] : [0]).flatMap(copy =>
                banners.map(banner => ({ banner, key: `${copy}-${banner.id}` }))
            ),
        [banners, loop]
    );

    useLayoutEffect(() => {
        const el = scrollerRef.current;
        if (!el || !loop) return;
        el.scrollLeft = banners.length * cardStep(el);
    }, [loop, banners.length]);

    useEffect(() => () => clearTimeout(settleTimer.current), []);

    const scrollByCard = useCallback((direction: 1 | -1) => {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollBy({ left: direction * cardStep(el), behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (!loop || !autoplayInterval) return;
        const interval = setInterval(() => {
            if (!pausedRef.current) {
                scrollByCard(1);
            }
        }, autoplayInterval);
        return () => clearInterval(interval);
    }, [loop, autoplayInterval, scrollByCard]);

    if (banners.length === 0) {
        return null;
    }

    const recenter = () => {
        const el = scrollerRef.current;
        if (!el || !loop) return;
        const setWidth = banners.length * cardStep(el);
        const index = Math.round(el.scrollLeft / cardStep(el));
        if (index < banners.length) {
            el.scrollLeft += setWidth;
        } else if (index >= banners.length * 2) {
            el.scrollLeft -= setWidth;
        }
    };

    const onScroll = () => {
        clearTimeout(settleTimer.current);
        settleTimer.current = setTimeout(recenter, 120);
    };

    const arrowClassName =
        'absolute top-1/2 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center overflow-hidden rounded-full text-iconPrimary backdrop-blur-[48px] opacity-0 transition-opacity duration-100 group-hover:opacity-100';

    return (
        <div
            className="group relative -mx-4"
            onPointerEnter={() => {
                pausedRef.current = true;
            }}
            onPointerLeave={() => {
                pausedRef.current = false;
            }}
        >
            <div
                ref={scrollerRef}
                onScroll={onScroll}
                className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {slides.map(({ banner, key }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onOpenApp(banner)}
                        className={cn(
                            'relative aspect-[2/1] shrink-0 cursor-pointer snap-center overflow-hidden rounded-2xl bg-backgroundContent text-left transition-opacity duration-100 hover:opacity-80',
                            isDesktop ? 'w-[calc(100%-162px)]' : 'w-[calc(100%-2rem)]'
                        )}
                    >
                        <img
                            src={banner.poster}
                            alt=""
                            loading="lazy"
                            className="absolute inset-0 size-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-4">
                            <img
                                src={banner.icon}
                                alt=""
                                loading="lazy"
                                className="size-11 shrink-0 rounded-xl object-cover"
                            />
                            <div className="min-w-0">
                                <div className="truncate text-label2 text-white">{banner.name}</div>
                                <div className="truncate text-body3Alt text-white/75">
                                    {banner.description}
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
            {isDesktop && loop && (
                <>
                    <div
                        className="pointer-events-none absolute inset-y-0 left-0 w-[124px] bg-backgroundPage"
                        style={EDGE_FADE_LEFT_STYLE}
                    />
                    <div
                        className="pointer-events-none absolute inset-y-0 right-0 w-[124px] bg-backgroundPage"
                        style={EDGE_FADE_RIGHT_STYLE}
                    />
                    <button
                        type="button"
                        aria-label="Previous banner"
                        onClick={() => scrollByCard(-1)}
                        className={`${arrowClassName} left-4`}
                    >
                        <div className="absolute inset-0 bg-backgroundContentTint opacity-[0.64]" />
                        <IcChevronLeft16 className="relative size-4" />
                    </button>
                    <button
                        type="button"
                        aria-label="Next banner"
                        onClick={() => scrollByCard(1)}
                        className={`${arrowClassName} right-4`}
                    >
                        <div className="absolute inset-0 bg-backgroundContentTint opacity-[0.64]" />
                        <IcChevronRight16 className="relative size-4" />
                    </button>
                </>
            )}
        </div>
    );
};
