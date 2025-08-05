import { css, styled } from 'styled-components';
import { FC, Fragment, useEffect, useRef, useState } from 'react';
import { CarouselItem, CarouselRootProvider, CarouselItemGroup, useCarousel } from '@ark-ui/react';

import {
    MainPromoEnIcon,
    MainPromoRuIcon,
    MultiSendPromoEnIcon,
    MultiSendPromoRuIcon,
    MultiSigPromoEnIcon,
    MultiWalletPromoEnIcon,
    MultiWalletPromoRuIcon,
    SupportPromoEnIcon,
    SupportPromoRuIcon
} from './icons';
import { Badge } from '../shared';
import { Body2Class, Label1, Label1Class } from '../Text';
import { FeatureSlideNames } from '../../enums/pro';
import { useTranslation } from '../../hooks/translation';
import { ChevronLeftIcon, ChevronRightIcon } from '../Icon';
import { useUserLanguage } from '../../state/language';
import { localizationText } from '@tonkeeper/core/dist/entries/language';

const CAROUSEL_TRIGGER_WIDTH = '40px';

export const PromoNotificationCarousel = () => {
    const { t } = useTranslation();
    const { data: lang } = useUserLanguage();
    const [observedSlide, setObservedSlide] = useState(FeatureSlideNames.MAIN);

    const carousel = useCarousel({
        slideCount: META_DATA_MAP.length
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

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

                <SwipeButton
                    data-swipe-button
                    type="button"
                    position="left"
                    onClick={() => carousel.scrollPrev(true)}
                    isVisible={carousel.canScrollPrev}
                >
                    <ChevronLeftIconStyled />
                </SwipeButton>

                <ItemGroupStyled ref={containerRef}>
                    {META_DATA_MAP.map((localProps, idx) => {
                        const { id, content, titleKey, subtitleKey, badgeComponent } = localProps;

                        const locText = localizationText(lang);
                        const langKey = ['ru', 'en'].includes(locText) ? locText : 'en';

                        return (
                            <Slide index={id} key={id} ref={el => (slideRefs.current[idx] = el)}>
                                <ImageWrapper isActive={observedSlide === idx}>
                                    {content[langKey as 'en' | 'ru']}
                                </ImageWrapper>

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
                            </Slide>
                        );
                    })}
                </ItemGroupStyled>

                <SwipeButton
                    data-swipe-button
                    type="button"
                    position="right"
                    onClick={() => carousel.scrollNext(true)}
                    isVisible={carousel.canScrollNext}
                >
                    <ChevronRightIconStyled />
                </SwipeButton>
            </RelativeWrapper>

            <DotsWrapper>
                {META_DATA_MAP.map(({ id }) => (
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
        content: {
            ru: <MainPromoRuIcon />,
            en: <MainPromoEnIcon />
        }
    },
    {
        id: FeatureSlideNames.MULTI_SIG,
        titleKey: 'promo_title_multisig_wallets',
        subtitleKey: 'promo_subtitle_multisig_wallets',
        content: {
            ru: <MultiSigPromoEnIcon />,
            en: <MultiSigPromoEnIcon />
        }
    },
    {
        id: FeatureSlideNames.MULTI_WALLET,
        titleKey: 'promo_title_multi_wallet_accounts',
        subtitleKey: 'promo_subtitle_multi_wallet_accounts',
        content: {
            ru: <MultiWalletPromoRuIcon />,
            en: <MultiWalletPromoEnIcon />
        }
    },
    {
        id: FeatureSlideNames.MULTI_SEND,
        titleKey: 'promo_title_multisend',
        badgeComponent: <LocalBadge />,
        subtitleKey: 'promo_subtitle_multisend',
        content: {
            ru: <MultiSendPromoRuIcon />,
            en: <MultiSendPromoEnIcon />
        }
    },
    {
        id: FeatureSlideNames.SUPPORT,
        titleKey: 'pro_feature_priority_support_title',
        subtitleKey: 'promo_subtitle_support',
        content: {
            ru: <SupportPromoRuIcon />,
            en: <SupportPromoEnIcon />
        }
    }
];

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
    cursor: unset;
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

const SubTitle = styled.span`
    ${Label1Class}
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

    @media (pointer: fine) {
        max-width: calc(100% - (${CAROUSEL_TRIGGER_WIDTH} * 2));
    }
`;
