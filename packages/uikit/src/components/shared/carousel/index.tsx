import { cloneElement, FC, PropsWithChildren, useLayoutEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { ChevronLeftIcon, ChevronRightIcon } from '../../Icon';

const Container = styled.div<{ gap: string }>`
    position: relative;
    display: flex;
    gap: ${props => props.gap};
    overflow-x: auto;

    -ms-overflow-style: none;
    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }

    > * {
        flex-shrink: 0;
    }
`;

const SwipeButton = styled.button<{ position: 'left' | 'right' }>`
    width: 40px;
    height: 40px;
    border-radius: ${props => props.theme.cornerFull};
    color: ${props => props.theme.textPrimary};
    background-color: ${props => props.theme.backgroundContentTint};
    opacity: 0.64;
    display: flex;
    justify-content: center;
    align-items: center;
    position: sticky;
    border: none;
    cursor: pointer;
    top: calc(50% - 20px);
    ${props => (props.position === 'left' ? 'left: 12px;' : 'right: 12px;')};
`;

export interface CarouselProps {
    gap: string;
    itemWidth: number | string;
}

export const Carousel: FC<PropsWithChildren & CarouselProps> = ({
    children,
    gap,
    itemWidth: itemW
}) => {
    const gapPx = parseFloat(gap);
    const moveButtonWidthPx = 40;
    const itemWidth = parseFloat(itemW.toString());
    const blockSize = itemWidth + gapPx;

    const containerRef = useRef<HTMLDivElement | null>(null);

    const childPrevPrevRef = useRef<HTMLElement>(null);
    const childNextNextRef = useRef<HTMLElement>(null);

    const [childPrev, childPrevPrev, childNext, childNextNext, childrenLength] = useMemo(() => {
        if (children && Array.isArray(children) && children.length > 2) {
            const _childPrev = cloneElement(children[children.length - 1]);
            const _childPrevPrev = cloneElement(children[children.length - 2], {
                ref: childPrevPrevRef
            });
            const _childNext = cloneElement(children[0]);
            const _childNextNext = cloneElement(children[1], { ref: childNextNextRef });

            return [_childPrev, _childPrevPrev, _childNext, _childNextNext, children.length];
        } else {
            return [null, null, null, null, 0];
        }
    }, [children]);

    const getScrollLeft = (blocksNumber: number) => {
        const container = containerRef.current;
        if (!container) {
            return 0;
        }
        const shift = (container.offsetWidth - itemWidth) / 2 - gapPx;
        return blockSize * blocksNumber - shift + moveButtonWidthPx;
    };

    useLayoutEffect(() => {
        const container = containerRef.current;
        const prevPrev = childPrevPrevRef.current;
        const nextNext = childNextNextRef.current;

        if (container && prevPrev && nextNext && childrenLength > 2) {
            container.scrollLeft = getScrollLeft(2);

            const options = {
                root: container,
                rootMargin: '0px',
                threshold: 0
            };

            const callback: IntersectionObserverCallback = entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (entry.target === prevPrev) {
                            requestAnimationFrame(() =>
                                container.scrollTo({
                                    left: container.scrollLeft + childrenLength * itemWidth - 4
                                })
                            );
                        } else {
                            requestAnimationFrame(() =>
                                container.scrollTo({
                                    left: container.scrollLeft - childrenLength * itemWidth + 4
                                })
                            );
                        }
                    }
                });
            };

            const observer = new IntersectionObserver(callback, options);
            observer.observe(nextNext);
            observer.observe(prevPrev);

            return () => {
                observer.unobserve(nextNext);
                observer.unobserve(prevPrev);
            };
        }
    }, []);

    const move = (direction: 'left' | 'right') => {
        const nextBlock = Math.ceil(
            (containerRef.current!.scrollLeft + containerRef.current!.offsetWidth) / blockSize
        );
        const prevBlock = Math.floor(
            (containerRef.current!.scrollLeft + moveButtonWidthPx) / blockSize
        );
        const blocksNumber = direction === 'left' ? prevBlock : nextBlock;
        containerRef.current?.scrollTo({
            left: getScrollLeft(blocksNumber - 1),
            behavior: 'smooth'
        });
    };

    const moveLeft = () => {
        move('left');
    };

    const moveRight = () => {
        move('right');
    };

    return (
        <Container gap={gap} ref={containerRef}>
            <SwipeButton position="left" onClick={moveLeft}>
                <ChevronLeftIcon />
            </SwipeButton>
            {childPrevPrev}
            {childPrev}
            {children}
            {childNext}
            {childNextNext}
            <SwipeButton position="right" onClick={moveRight}>
                <ChevronRightIcon />
            </SwipeButton>
        </Container>
    );
};
