import { FC, PropsWithChildren, useEffect, useMemo, WheelEvent } from 'react';
import { Carousel as ArkCarousel, useCarousel } from '@ark-ui/react';
import styled from 'styled-components';
import { ChevronLeftIcon, ChevronRightIcon } from '../../Icon';

const SwipeButton = styled.button<{ position: 'left' | 'right' }>`
    width: 40px;
    height: 40px;
    border-radius: ${props => props.theme.cornerFull};
    color: ${props => props.theme.textPrimary};
    background-color: ${props => props.theme.backgroundContentTint};
    opacity: 0.64;
    display: none;
    justify-content: center;
    align-items: center;
    position: absolute;
    z-index: 2;
    border: none;
    cursor: pointer;
    top: calc(50% - 20px);
    ${props => (props.position === 'left' ? 'left: 12px;' : 'right: 12px;')};
    transition: opacity 0.15s ease-in-out;

    @media (pointer: fine) {
        display: flex;
    }

    &:hover {
        opacity: 0.8;
    }
`;

const CarouselWrapper = styled.div<{ gap: string; slidesToShow: number; centerPadding: string }>`
    overflow: hidden;
    position: relative;
    padding-left: ${props => props.centerPadding};
    display: flex;
    flex-direction: column;

    * {
        -webkit-tap-highlight-color: transparent;
    }

    .carousel-item {
        flex: 0 0 calc(100% / ${props => props.slidesToShow});
        padding: 0 ${props => parseFloat(props.gap) / 2}px;
        box-sizing: border-box;
    }

    .carousel {
        display: flex;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        gap: ${props => props.gap};
    }
`;

export interface CarouselProps {
    gap: string;
    className?: string;
    infinite?: boolean;
    autoplaySpeed?: number;
    slidesToShow?: number;
    centerPadding?: string;
}

export const Carousel: FC<PropsWithChildren<CarouselProps>> = ({
    children,
    gap,
    className,
    infinite = true,
    autoplaySpeed,
    slidesToShow = 1,
    centerPadding = '0px'
}) => {
    const childrenArray = useMemo(() => {
        const arr = Array.isArray(children) ? children : [children];
        if (infinite) {
            return [...arr, ...arr, ...arr];
        }
        return arr;
    }, [children, infinite]);
    const slideCount = childrenArray.length;

    const carousel = useCarousel({
        loop: infinite,
        slideCount,
        orientation: 'horizontal',
        allowMouseDrag: true,
        slidesPerPage: slidesToShow,
        padding: '12px',
        defaultPage: infinite ? Math.round(slideCount / 2) : 0
    });

    useEffect(() => {
        if (!autoplaySpeed) return;
        const interval = setInterval(() => {
            carousel?.scrollNext();
        }, autoplaySpeed);
        return () => clearInterval(interval);
    }, [autoplaySpeed, carousel]);

    const canGoLeft = infinite || carousel?.page > 0;
    const canGoRight = infinite || carousel?.page < slideCount - 1;

    return (
        <ArkCarousel.RootProvider value={carousel}>
            <CarouselWrapper
                gap={gap}
                slidesToShow={slidesToShow}
                centerPadding={centerPadding}
                className={className}
                onWheel={(e: WheelEvent) => {
                    if (e.deltaX > 0) carousel?.scrollNext();
                    else if (e.deltaX < 0) carousel?.scrollPrev();
                }}
            >
                {canGoLeft && (
                    <SwipeButton position="left" onClick={() => carousel?.scrollPrev()}>
                        <ChevronLeftIcon />
                    </SwipeButton>
                )}

                <ArkCarousel.ItemGroup>
                    {childrenArray.map((child, i) => (
                        <ArkCarousel.Item key={i} index={i} className="carousel-item">
                            {child}
                        </ArkCarousel.Item>
                    ))}
                </ArkCarousel.ItemGroup>

                {canGoRight && (
                    <SwipeButton position="right" onClick={() => carousel?.scrollNext()}>
                        <ChevronRightIcon />
                    </SwipeButton>
                )}
            </CarouselWrapper>
        </ArkCarousel.RootProvider>
    );
};
