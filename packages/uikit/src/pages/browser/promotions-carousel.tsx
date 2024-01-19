import { Body3, Label2 } from '../../components/Text';
import { FC } from 'react';
import { Carousel } from '../../components/shared';
import styled from 'styled-components';
import { CarouselApp } from '../../hooks/browser/useRecommendations';
import { PromotedItem, PromotedItemImage, PromotedItemText } from './promoted-item';
import { useOpenLinkOnAreaClick } from '../../hooks/useAreaClick';

const CarouselCard = styled.div<{ img: string }>`
    width: 448px;
    height: 224px;

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
    return (
        <Carousel className={className} gap="8px" autoplay={true} autoplaySpeed={1000 * 10}>
            {apps.map(item => (
                <CarouselItem item={item} key={item.url} />
            ))}
        </Carousel>
    );
};

const CarouselItem: FC<{ item: CarouselApp }> = ({ item }) => {
    const ref = useOpenLinkOnAreaClick(item.url);

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
