import { css, styled } from 'styled-components';
import { FC, Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { CarouselItem, CarouselItemGroup, CarouselRootProvider, useCarousel } from '@ark-ui/react';

import { Badge } from '../shared';
import { Body2Class, Label1, Label1Class } from '../Text';
import { FeatureSlideNames } from '../../enums/pro';
import { useTranslation } from '../../hooks/translation';
import { ChevronLeftIcon, ChevronRightIcon } from '../Icon';
import { useUserLanguage } from '../../state/language';
import { localizationText } from '@tonkeeper/core/dist/entries/language';
import { useAppContext } from '../../hooks/appContext';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../../state/tonendpoint';

export const PromoNotificationCarousel = () => {
    const { t } = useTranslation();
    const { data: lang } = useUserLanguage();
    const { mainnetConfig } = useAppContext();
    const [observedSlide, setObservedSlide] = useState(FeatureSlideNames.MAIN);
    const metaData = useProCarouselMetaData();

    const carousel = useCarousel({
        slideCount: metaData.length
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

    const baseSlideUrl = mainnetConfig.pro_media_base_url;

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
                <GradientLayer $page={observedSlide} $total={metaData.length} />

                <ItemGroupStyled ref={containerRef}>
                    {metaData.map((localProps, idx) => {
                        const { id, titleKey, src, subtitleKey, badgeComponent } = localProps;

                        const locText = localizationText(lang);
                        const langKey = locText === 'ru' ? 'ru' : 'eng';

                        return (
                            <Slide index={id} key={id} ref={el => (slideRefs.current[idx] = el)}>
                                <ImageWrapper isActive={observedSlide === idx}>
                                    <SlideImage
                                        src={`${baseSlideUrl}${src[langKey]}`}
                                        alt={titleKey}
                                    />
                                </ImageWrapper>

                                <DescriptionBlockWrapper>
                                    <SwipeButton
                                        data-swipe-button
                                        type="button"
                                        margin="left"
                                        onClick={() => carousel.scrollPrev(true)}
                                        isVisible={carousel.canScrollPrev}
                                    >
                                        <ChevronLeftIconStyled />
                                    </SwipeButton>

                                    <DescriptionBlock>
                                        <LocalBadgedTitleStyled
                                            titleKey={titleKey}
                                            badgeComponent={badgeComponent}
                                        />
                                        <SubTitle>
                                            {t(subtitleKey)
                                                .split('%')
                                                .map(line => (
                                                    <Fragment key={line}>
                                                        {line}
                                                        <br />
                                                    </Fragment>
                                                ))}
                                        </SubTitle>
                                    </DescriptionBlock>

                                    <SwipeButton
                                        data-swipe-button
                                        type="button"
                                        margin="right"
                                        onClick={() => carousel.scrollNext(true)}
                                        isVisible={carousel.canScrollNext}
                                    >
                                        <ChevronRightIconStyled />
                                    </SwipeButton>
                                </DescriptionBlockWrapper>
                            </Slide>
                        );
                    })}
                </ItemGroupStyled>
            </RelativeWrapper>

            <DotsWrapper>
                {metaData.map(({ id }) => (
                    <Dot isActive={id === observedSlide} key={id} />
                ))}
            </DotsWrapper>
        </CarouselWrapper>
    );
};

const LocalBadge = () => {
    const { t } = useTranslation();

    return (
        <Badge color="textSecondary" size="s" display="inline-block">
            {t('desktop_only')}
        </Badge>
    );
};

const META_DATA_MAP = [
    {
        id: FeatureSlideNames.MAIN,
        titleKey: 'tonkeeper_pro_subscription',
        subtitleKey: 'promo_subtitle_subscription',
        src: {
            ru: 'ru/1.png',
            eng: 'eng/1.png'
        }
    },
    {
        id: FeatureSlideNames.MULTI_SIG,
        titleKey: 'promo_title_multisig_wallets',
        subtitleKey: 'promo_subtitle_multisig_wallets',
        src: {
            ru: 'ru/2.png',
            eng: 'eng/2.png'
        }
    },
    {
        id: FeatureSlideNames.MULTI_WALLET,
        titleKey: 'promo_title_multi_wallet_accounts',
        subtitleKey: 'promo_subtitle_multi_wallet_accounts',
        src: {
            ru: 'ru/3.png',
            eng: 'eng/3.png'
        }
    },
    {
        id: FeatureSlideNames.MULTI_SEND,
        titleKey: 'promo_title_multisend',
        badgeComponent: <LocalBadge />,
        subtitleKey: 'promo_subtitle_multisend',
        src: {
            ru: 'ru/4.png',
            eng: 'eng/4.png'
        }
    },
    {
        id: FeatureSlideNames.SUPPORT,
        titleKey: 'pro_feature_priority_support_title',
        subtitleKey: 'promo_subtitle_support',
        src: {
            ru: 'ru/5.png',
            eng: 'eng/5.png'
        }
    }
];

export const useProCarouselMetaData = () => {
    const isTronEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.TRON);

    // FeatureSlideNames.SUPPORT contains information about Tron transfers that are not available for some users due to region restrictions
    return useMemo(
        () => META_DATA_MAP.filter(item => item.id !== FeatureSlideNames.SUPPORT || isTronEnabled),
        [isTronEnabled]
    );
};

type LocalBadgedTitleProps = Pick<(typeof META_DATA_MAP)[number], 'titleKey' | 'badgeComponent'>;
const LocalBadgedTitle: FC<LocalBadgedTitleProps & { className?: string }> = props => {
    const { t } = useTranslation();
    const { titleKey, badgeComponent: badge, className } = props;

    return (
        <div className={className}>
            <Label1>{t(titleKey)}</Label1>
            {!!badge && badge}
        </div>
    );
};

const LocalBadgedTitleStyled = styled(LocalBadgedTitle)`
    display: flex;
    align-items: center;
    gap: 6px;
`;

const ChevronLeftIconStyled = styled(ChevronLeftIcon)`
    width: 28px;
    height: 28px;
`;

const ChevronRightIconStyled = styled(ChevronRightIcon)`
    width: 28px;
    height: 28px;
`;

const CarouselWrapper = styled(CarouselRootProvider)`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    overflow: hidden;

    -webkit-user-select: none;
`;

const ItemGroupStyled = styled(CarouselItemGroup)`
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
        aspect-ratio: ${p => p.$total} / 1;
        background: linear-gradient(
            70deg,
            #49a6f4 0%,
            #3885f4 24.67%,
            #3ab0e3 49.06%,
            #9183fc 69.65%,
            #4d89f2 100%
        );
        transform: translateX(${({ $page, $total }) => `-${($page * 100) / $total}%`});
        transition: transform 0.5s ease-out;
    }
`;

const Slide = styled(CarouselItem)`
    display: flex;
    flex: 0 0 100%;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    scroll-snap-align: center;
    color: white;
    z-index: 1;
`;

const SwipeButton = styled.button<{ margin: 'left' | 'right'; isVisible: boolean }>`
    display: none;
    align-items: center;
    justify-content: center;
    ${props => (props.margin === 'left' ? 'margin-left: 12px;' : 'margin-right: 12px;')};
    width: 40px;
    aspect-ratio: 1 / 1;
    border: none;
    color: ${props => props.theme.textTertiary};
    transition: opacity 0.3s ease-in-out, color 0.3s ease;
    cursor: unset;
    z-index: 2;

    @media (pointer: fine) {
        display: flex;
    }

    ${({ isVisible }) =>
        isVisible
            ? css`
                  opacity: 1;
                  cursor: pointer;

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
    transition: transform 0.3s ease-out, opacity 0.3s ease-out;
    transform: scale(${({ isActive }) => (isActive ? 1 : 0.7)});
    opacity: ${({ isActive }) => (isActive ? 1 : 0.2)};

    @media (min-width: 550px) {
        max-height: 40dvh;
    }
`;

const SlideImage = styled.img`
    height: calc(100% - 80px);
    aspect-ratio: 1;
    pointer-events: none;
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

const SubTitle = styled.span`
    ${Label1Class};
    text-align: center;
    text-wrap: balance;
    color: ${p => p.theme.textSecondary};

    @media (pointer: fine) {
        ${Body2Class}
    }
`;

const DescriptionBlock = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 32px 0 28px;
`;

const DescriptionBlockWrapper = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    align-items: center;
    width: 100%;

    @media (pointer: fine) {
        grid-template-columns: 52px 1fr 52px;
    }
`;
