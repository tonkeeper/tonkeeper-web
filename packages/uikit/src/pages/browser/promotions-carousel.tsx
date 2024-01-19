import { Body3, Label2 } from '../../components/Text';
import { FC, useRef } from 'react';
import { Carousel } from '../../components/shared';
import styled from 'styled-components';
import { CarouselApp } from '../../hooks/browser/useRecommendations';
import { useAppSdk } from '../../hooks/appSdk';
import { PromotedItem, PromotedItemImage, PromotedItemText } from './promoted-item';

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

export const PromotionsCarousel: FC<{ apps: CarouselApp[] }> = ({ apps }) => {
    const sdk = useAppSdk();

    const clickedPosition = useRef<{ clientX: number; clientY: number }>({
        clientX: 0,
        clientY: 0
    });

    return (
        <Carousel gap="8px" autoplay={true} autoplaySpeed={1000 * 10}>
            {apps.map(item => (
                <CarouselCard
                    key={item.url}
                    img={item.poster}
                    onMouseDown={e =>
                        (clickedPosition.current = {
                            clientY: e.clientY,
                            clientX: e.clientX
                        })
                    }
                    onMouseUp={e => {
                        const xInArea = Math.abs(e.clientX - clickedPosition.current.clientX) < 10;
                        const yInArea = Math.abs(e.clientY - clickedPosition.current.clientY) < 10;
                        if (xInArea && yInArea) {
                            sdk.openPage(item.url);
                        }
                    }}
                >
                    <CarouselCardFooter>
                        <PromotedItemImage src={item.icon} />
                        <PromotedItemText color={item.textColor}>
                            <Label2>{item.name}</Label2>
                            <Body3>{item.description}</Body3>
                        </PromotedItemText>
                    </CarouselCardFooter>
                </CarouselCard>
            ))}
        </Carousel>
    );
};
