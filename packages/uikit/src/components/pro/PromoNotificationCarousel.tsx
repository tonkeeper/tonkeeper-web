import { css, styled } from 'styled-components';
import { FC, Fragment, useEffect, useRef, useState } from 'react';
import { Carousel as ArkCarousel, useCarousel } from '@ark-ui/react';

import {
    MainPromoIcon,
    MultiSendPromoIcon,
    MultiSigPromoIcon,
    MultiWalletPromoIcon,
    SupportPromoIcon
} from './icons';
import { Body2, Label1 } from '../Text';
import { FeatureSlideNames } from '../../enums/pro';
import { useTranslation } from '../../hooks/translation';
import { ChevronLeftIcon, ChevronRightIcon } from '../Icon';

const CAROUSEL_TRIGGER_WIDTH = '40px';

interface Props {
    initialSlideName?: FeatureSlideNames;
}

export const PromoNotificationCarousel: FC<Props> = ({ initialSlideName }) => {
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState(FeatureSlideNames.MAIN);
    const [observedSlide, setObservedSlide] = useState(currentPage);
    const carousel = useCarousel({
        page: currentPage,
        onPageChange: ({ page }) => setCurrentPage(page),
        slideCount: META_DATA_MAP.length
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        if (!initialSlideName) return;

        carousel.scrollTo(initialSlideName, true);
    }, [initialSlideName]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                const visibleEntries = entries.filter(e => e.isIntersecting);
                if (visibleEntries.length === 0) return;

                const mostVisible = visibleEntries.reduce((max, entry) =>
                    entry.intersectionRatio > max.intersectionRatio ? entry : max
                );

                const index = slideRefs.current.findIndex(ref => ref === mostVisible.target);
                if (index !== -1 && index !== observedSlide) {
                    setObservedSlide(index);
                }
            },
            {
                root: containerRef.current,
                threshold: [0.4, 0.6, 0.75]
            }
        );

        slideRefs.current.forEach(slide => {
            if (slide) observer.observe(slide);
        });

        return () => observer.disconnect();
    }, [observedSlide]);

    return (
        <CarouselWrapper value={carousel}>
            <RelativeWrapper>
                <GradientLayer $page={observedSlide} $total={META_DATA_MAP.length} />

                <ArkCarousel.PrevTrigger asChild>
                    <SwipeButton
                        data-swipe-button
                        type="button"
                        position="left"
                        isVisible={observedSlide !== 0}
                    >
                        <ChevronLeftIconStyled />
                    </SwipeButton>
                </ArkCarousel.PrevTrigger>

                <ItemGroupStyled ref={containerRef}>
                    {META_DATA_MAP.map(({ id, content, title, subtitle }, idx) => (
                        <Slide index={id} key={id} ref={el => (slideRefs.current[idx] = el)}>
                            <ImageWrapper isActive={observedSlide === idx}>{content}</ImageWrapper>

                            <DescriptionBlock>
                                <Label1>{t(title)}</Label1>
                                <Body2Styled>
                                    {t(subtitle)
                                        .split('%')
                                        .map(line => (
                                            <Fragment key={line}>
                                                {line}
                                                <br />
                                            </Fragment>
                                        ))}
                                </Body2Styled>
                            </DescriptionBlock>
                        </Slide>
                    ))}
                </ItemGroupStyled>

                <ArkCarousel.NextTrigger>
                    <SwipeButton
                        data-swipe-button
                        type="button"
                        position="right"
                        isVisible={observedSlide !== META_DATA_MAP.length - 1}
                    >
                        <ChevronRightIconStyled />
                    </SwipeButton>
                </ArkCarousel.NextTrigger>
            </RelativeWrapper>

            <DotsWrapper>
                {META_DATA_MAP.map(({ id }) => (
                    <Dot isActive={id === observedSlide} key={id} />
                ))}
            </DotsWrapper>
        </CarouselWrapper>
    );
};

const META_DATA_MAP = [
    {
        id: FeatureSlideNames.MAIN,
        title: 'tonkeeper_pro_subscription',
        subtitle: 'promo_subtitle_subscription',
        content: <MainPromoIcon />
    },
    {
        id: FeatureSlideNames.MULTI_SIG,
        title: 'promo_title_multisig_wallets',
        subtitle: 'promo_subtitle_multisig_wallets',
        content: <MultiSigPromoIcon />
    },
    {
        id: FeatureSlideNames.MULTI_WALLET,
        title: 'promo_title_multi_wallet_accounts',
        subtitle: 'promo_subtitle_multi_wallet_accounts',
        content: <MultiWalletPromoIcon />
    },
    {
        id: FeatureSlideNames.MULTI_SEND,
        title: 'promo_title_multisend',
        subtitle: 'promo_subtitle_multisend',
        content: <MultiSendPromoIcon />
    },
    {
        id: FeatureSlideNames.SUPPORT,
        title: 'pro_feature_priority_support_title',
        subtitle: 'promo_subtitle_support',
        content: <SupportPromoIcon />
    }
];

const ChevronLeftIconStyled = styled(ChevronLeftIcon)`
    width: 28px;
    height: 28px;
`;

const ChevronRightIconStyled = styled(ChevronRightIcon)`
    width: 28px;
    height: 28px;
`;

const CarouselWrapper = styled(ArkCarousel.RootProvider)`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    overflow: hidden;
`;

const ItemGroupStyled = styled(ArkCarousel.ItemGroup)`
    overflow-x: auto;

    @media (pointer: fine) {
        overflow-x: hidden !important;
    }
`;

const RelativeWrapper = styled.div`
    position: relative;
    width: 100%;
    overflow: hidden;
`;

const GradientLayer = styled.div<{ $page: number; $total: number }>`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    z-index: 0;
    border-radius: ${props => props.theme.corner2xSmall};

    @media (min-width: 550px) {
        max-height: 40dvh;
        aspect-ratio: unset;
    }

    &::before {
        content: '';
        display: block;
        width: ${({ $total }) => `${$total * 100}%`};
        aspect-ratio: 5 / 1;
        background: linear-gradient(
            70deg,
            #49a6f4 0%,
            #3885f4 24.67%,
            #3ab0e3 49.06%,
            #9183fc 69.65%,
            #4d89f2 100%
        );
        transform: translateX(${({ $page, $total }) => `-${($page * 100) / $total}%`});
        transition: transform 1s ease-out;
    }
`;

const Slide = styled(ArkCarousel.Item)`
    display: flex;
    flex: 0 0 100%;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    scroll-snap-align: center;
    color: white;
    z-index: 1;
`;

const SwipeButton = styled.button<{ position: 'left' | 'right'; isVisible: boolean }>`
    width: ${CAROUSEL_TRIGGER_WIDTH};
    aspect-ratio: 1 / 1;
    color: ${props => props.theme.textTertiary};
    display: none;
    justify-content: center;
    align-items: center;
    position: absolute;
    z-index: 2;
    border: none;
    cursor: pointer;
    bottom: 36px;
    transform: translateY(-50%);
    ${props => (props.position === 'left' ? 'left: 12px;' : 'right: 12px;')};
    transition: opacity 0.3s ease-in-out, color 0.3s ease;

    @media (pointer: fine) {
        display: flex;
    }

    ${({ isVisible }) =>
        isVisible
            ? css`
                  opacity: 1;

                  &:hover {
                      opacity: 0.8;
                  }
              `
            : css`
                  opacity: 0;
              `}
`;

const ImageWrapper = styled.div<{ isActive: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 1;
    transition: transform 0.5s ease-out, opacity 0.5s ease-out;
    transform: scale(${({ isActive }) => (isActive ? 1 : 0.7)});
    opacity: ${({ isActive }) => (isActive ? 1 : 0.2)};

    @media (min-width: 550px) {
        max-height: 40dvh;
    }

    & > svg {
        margin: 40px;
        height: calc(100% - 80px);
        aspect-ratio: 1;
    }
`;

const DotsWrapper = styled.div`
    display: flex;
    gap: 8px;
`;

const Dot = styled.div<{ isActive: boolean }>`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${({ theme, isActive }) =>
        isActive ? theme.buttonPrimaryBackground : theme.backgroundContentTint};
    transition: background-color 0.3s;
`;

const Body2Styled = styled(Body2)`
    text-align: center;
    color: ${p => p.theme.textSecondary};
`;

const DescriptionBlock = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 32px 0 28px;

    @media (pointer: fine) {
        max-width: calc(100% - (${CAROUSEL_TRIGGER_WIDTH} * 2));
    }
`;
