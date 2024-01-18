import { FC, PropsWithChildren, useRef, WheelEvent } from 'react';
import styled from 'styled-components';
import Slider from 'react-slick';
import { ChevronLeftIcon, ChevronRightIcon } from '../../Icon';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

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
    position: absolute;
    z-index: 2;
    border: none;
    cursor: pointer;
    top: calc(50% - 20px);
    ${props => (props.position === 'left' ? 'left: 12px;' : 'right: 12px;')};
    transition: opacity 0.2s ease-in-out;

    &:hover {
        opacity: 0.8;
    }
`;

const SliderStyled = styled(Slider)<{ gap: string }>`
    .slick-list {
        margin: 0 -${props => parseFloat(props.gap) / 2}px;
    }
    .slick-slide > div {
        margin: 0 ${props => parseFloat(props.gap) / 2}px;
    }
`;

const CarouselWrapper = styled.div`
    overflow: hidden;
    position: relative;
`;

export interface CarouselProps {
    gap: string;
}

export const Carousel: FC<PropsWithChildren & CarouselProps> = ({ children, gap }) => {
    const sliderRef = useRef<Slider | null>(null);
    const isSwiping = useRef(false);
    const settings = {
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        centerMode: true
    };

    const onWheel = (e: WheelEvent) => {
        if (!isSwiping.current) {
            isSwiping.current = true;

            if (e.deltaX > 0) {
                return sliderRef.current?.slickNext();
            }

            if (e.deltaX < 0) {
                return sliderRef.current?.slickPrev();
            }
        }
    };

    const blockSwipe = () => {
        isSwiping.current = true;
    };

    const unblockSwipe = () => {
        isSwiping.current = false;
    };

    return (
        <CarouselWrapper onWheel={onWheel}>
            <SwipeButton position="left" onClick={() => sliderRef.current?.slickPrev()}>
                <ChevronLeftIcon />
            </SwipeButton>
            <SliderStyled
                ref={sliderRef}
                beforeChange={blockSwipe}
                afterChange={unblockSwipe}
                gap={gap}
                {...settings}
            >
                {children}
            </SliderStyled>
            <SwipeButton position="right" onClick={() => sliderRef.current?.slickNext()}>
                <ChevronRightIcon />
            </SwipeButton>
        </CarouselWrapper>
    );
};
