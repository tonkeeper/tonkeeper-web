import { css, styled } from 'styled-components';
import { Fragment, useState } from 'react';
import { Carousel as ArkCarousel } from '@ark-ui/react';
import { Body2, Label1 } from '../Text';
import { useTranslation } from '../../hooks/translation';
import {
    MainPromoIcon,
    MultiSigPromoIcon,
    MultiWalletPromoIcon,
    SupportPromoIcon,
    MultiSendPromoIcon
} from './icons';
import { ChevronLeftIcon, ChevronRightIcon } from '../Icon';

const META_DATA_MAP = [
    {
        title: 'tonkeeper_pro_subscription',
        subtitle: 'promo_subtitle_subscription',
        content: <MainPromoIcon />
    },
    {
        title: 'promo_title_multisig_wallets',
        subtitle: 'promo_subtitle_multisig_wallets',
        content: <MultiSigPromoIcon />
    },
    {
        title: 'promo_title_multi_wallet_accounts',
        subtitle: 'promo_subtitle_multi_wallet_accounts',
        content: <MultiWalletPromoIcon />
    },
    {
        title: 'promo_title_multisend',
        subtitle: 'promo_subtitle_multisend',
        content: <MultiSendPromoIcon />
    },
    {
        title: 'pro_feature_priority_support_title',
        subtitle: 'promo_subtitle_support',
        content: <SupportPromoIcon />
    }
];
const CAROUSEL_TRIGGER_WIDTH = '40px';

export const PromoNotificationCarousel = () => {
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState(0);

    return (
        <CarouselWrapper
            page={currentPage}
            slideCount={META_DATA_MAP.length}
            onPageChange={({ page }) => setCurrentPage(page)}
        >
            <RelativeWrapper>
                <GradientLayer $page={currentPage} $total={META_DATA_MAP.length} />

                <ArkCarousel.PrevTrigger asChild>
                    <SwipeButton
                        data-swipe-button
                        type="button"
                        position="left"
                        isVisible={currentPage !== 0}
                    >
                        <ChevronLeftIconStyled />
                    </SwipeButton>
                </ArkCarousel.PrevTrigger>

                <ArkCarousel.ItemGroup>
                    {META_DATA_MAP.map((_, i) => (
                        <Slide index={i} key={i}>
                            <ImageWrapper>{META_DATA_MAP[i].content}</ImageWrapper>

                            <DescriptionBlock>
                                <Label1>{t(META_DATA_MAP[i].title)}</Label1>
                                <Body2Styled>
                                    {t(META_DATA_MAP[i].subtitle)
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
                </ArkCarousel.ItemGroup>

                <ArkCarousel.NextTrigger>
                    <SwipeButton
                        data-swipe-button
                        type="button"
                        position="right"
                        isVisible={currentPage !== META_DATA_MAP.length - 1}
                    >
                        <ChevronRightIconStyled />
                    </SwipeButton>
                </ArkCarousel.NextTrigger>
            </RelativeWrapper>

            <DotsWrapper>
                {META_DATA_MAP.map((_, i) => (
                    <Dot index={i} key={i} />
                ))}
            </DotsWrapper>
        </CarouselWrapper>
    );
};

const ChevronLeftIconStyled = styled(ChevronLeftIcon)`
    width: 28px;
    height: 28px;
`;

const ChevronRightIconStyled = styled(ChevronRightIcon)`
    width: 28px;
    height: 28px;
`;

const CarouselWrapper = styled(ArkCarousel.Root)`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    overflow: hidden;
`;

const RelativeWrapper = styled.div`
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 24px;
`;

const GradientLayer = styled.div<{ $page: number; $total: number }>`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    z-index: 0;
    border-radius: 24px;

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
        transition: transform 2s ease-out;
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

const ImageWrapper = styled.div`
    width: 100%;
    aspect-ratio: 1;

    & > svg {
        margin: 40px;
    }
`;

const DotsWrapper = styled(ArkCarousel.IndicatorGroup)`
    display: flex;
    gap: 8px;
`;

const Dot = styled(ArkCarousel.Indicator)`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${({ theme }) => theme.backgroundContentTint};
    transition: background-color 0.3s;

    &[data-current] {
        background-color: ${({ theme }) => theme.buttonPrimaryBackground};
    }
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
