import { styled } from 'styled-components';
import { FC, useMemo, useState } from 'react';
import { Carousel as ArkCarousel, useCarousel } from '@ark-ui/react';
import { Body2, Label1 } from '../Text';
import { useTranslation } from '../../hooks/translation';

interface ChatCarouselProps {
    slideCount: number;
    className?: string;
}

export const PromoNotificationCarousel: FC<ChatCarouselProps> = ({ slideCount, className }) => {
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState(0);

    const carousel = useCarousel({
        loop: false,
        slideCount,
        onPageChange: ({ page }) => setCurrentPage(page),
        orientation: 'horizontal',
        allowMouseDrag: true,
        slidesPerPage: 1,
        defaultPage: 0
    });

    const slides = useMemo(() => Array.from({ length: slideCount }), [slideCount]);

    return (
        <ArkCarousel.RootProvider
            style={{
                width: '100%'
            }}
            value={carousel}
        >
            <CarouselWrapper className={className}>
                <ArkCarousel.ItemGroup asChild>
                    <CarouselTrack>
                        {slides.map((_, i) => (
                            <ArkCarousel.Item asChild index={i} key={i}>
                                <Slide />
                            </ArkCarousel.Item>
                        ))}
                    </CarouselTrack>
                </ArkCarousel.ItemGroup>

                <DescriptionBlock>
                    <Label1>{t('pro_feature_priority_support_title')}</Label1>
                    <Body2Styled>{t('real_human_experts')}</Body2Styled>
                </DescriptionBlock>

                <PaginationDots count={slideCount} active={currentPage}>
                    {slides.map((_, i) => (
                        <div key={i} />
                    ))}
                </PaginationDots>
            </CarouselWrapper>
        </ArkCarousel.RootProvider>
    );
};

const CarouselWrapper = styled.div`
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
`;

const CarouselTrack = styled.div`
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    width: 100%;
`;

const Slide = styled.div`
    flex: 0 0 100%;
    width: 100%;
    aspect-ratio: 1 / 1;
    scroll-snap-align: center;
    border-radius: 12px;
    background: linear-gradient(160deg, #c088f8, #7a36bd);
    cursor: pointer;
`;

const PaginationDots = styled.div<{ count: number; active: number }>`
    display: flex;
    gap: 8px;
    margin-top: 16px;

    & > div {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: ${props => props.theme.backgroundContentTint ?? '#fff'};
    }

    & > div:nth-child(${props => props.active + 1}) {
        background-color: ${props => props.theme.buttonPrimaryBackground ?? '#00f'};
    }
`;

const Body2Styled = styled(Body2)`
    max-width: 250px;
    text-align: center;
    color: ${p => p.theme.textSecondary};
`;

const DescriptionBlock = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 32px 0 28px;
`;
