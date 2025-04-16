import { FC, PropsWithChildren, TouchEvent, useEffect, useRef } from 'react';

export const MPCarouselScroll: FC<PropsWithChildren> = ({ children }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!scrollRef.current) return;

        const ionContent = scrollRef.current.closest('ion-content');
        if (!ionContent) return;

        let started = false;
        let startX = 0;

        const handleTouchMove = (e: Event) => {
            const touchEvent = e as unknown as TouchEvent;
            const slider = scrollRef.current;
            if (slider?.contains(touchEvent.target as Node)) {
                if (slider.scrollLeft !== 0) {
                    touchEvent.stopPropagation();
                }

                if (!started) {
                    return;
                }

                const endX = touchEvent.changedTouches[0].pageX;
                const diff = startX - endX;

                if (Math.abs(diff) > 30) {
                    const screenWidth = window.innerWidth;
                    if (diff > 0) {
                        slider.scrollTo({
                            left: slider.scrollLeft + screenWidth,
                            top: slider.scrollTop,
                            behavior: 'smooth'
                        });
                    } else {
                        slider.scrollTo({
                            left: slider.scrollLeft - screenWidth,
                            top: slider.scrollTop,
                            behavior: 'smooth'
                        });
                    }
                    started = false;
                }
            }
        };

        const handleTouchStart = (e: Event) => {
            const slider = scrollRef.current;
            if (!slider?.contains(e.target as Node)) return;

            started = true;
            startX = (e as unknown as TouchEvent).touches[0].pageX;
        };

        ionContent.addEventListener('touchmove', handleTouchMove, { capture: true });
        ionContent.addEventListener('touchstart', handleTouchStart, { capture: true });

        return () => {
            ionContent.removeEventListener('touchmove', handleTouchMove, { capture: true });
            ionContent.removeEventListener('touchstart', handleTouchStart, { capture: true });
        };
    }, []);

    return (
        <div
            ref={scrollRef}
            style={{
                overflowX: 'hidden',
                whiteSpace: 'nowrap',
                display: 'flex',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
            }}
        >
            {children}
        </div>
    );
};
