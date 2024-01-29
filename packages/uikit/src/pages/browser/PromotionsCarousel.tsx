import { CarouselApp } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { FC } from 'react';
import styled from 'styled-components';
import { Body3, Label2 } from '../../components/Text';
import { Carousel } from '../../components/shared';
import { useAppContext } from '../../hooks/appContext';
import { useOpenLinkOnAreaClick } from '../../hooks/useAreaClick';
import { PromotedItem, PromotedItemImage, PromotedItemText } from './PromotedItem';

const CarouselCard = styled.div<{ img: string }>`
    width: 100%;
    aspect-ratio: 2 / 1;

    background-image: ${props => `url(${props.img})`};
    background-size: cover;
    border-radius: ${props => props.theme.cornerSmall};

    display: inline-flex !important;
    align-items: flex-end;
    justify-content: flex-start;
    cursor: pointer;
`;
const CarouselCardFooter = styled(PromotedItem)`
    margin-left: 1rem;
`;

export const PromotionsCarousel: FC<{ apps: CarouselApp[]; className?: string }> = ({
    apps,
    className
}) => {
    const { config } = useAppContext();
    const speed = config.featured_play_interval || 1000 * 10;

    return (
        <Carousel
            className={className}
            gap="8px"
            autoplay={true}
            centerPadding="16px"
            autoplaySpeed={speed}
        >
            {apps.map(item => (
                <CarouselItem item={item} key={item.url} />
            ))}
        </Carousel>
    );
};

const CarouselItem: FC<{ item: CarouselApp }> = ({ item }) => {
    const { tonendpoint } = useAppContext();
    const ref = useOpenLinkOnAreaClick(item.url, 'featured', tonendpoint.getTrack());

    return (
        <CarouselCard img={item.poster} ref={ref}>
            <CarouselCardFooter>
                <PromotedItemImage src={item.icon} />
                <PromotedItemText color={item.textColor}>
                    <Label2>{item.name}</Label2>
                    <Body3>{item.description}</Body3>
                </PromotedItemText>
            </CarouselCardFooter>
        </CarouselCard>
    );
};
