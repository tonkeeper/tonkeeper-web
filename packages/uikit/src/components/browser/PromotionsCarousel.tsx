import { CarouselApp } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { ComponentProps, FC, useCallback } from 'react';
import styled from 'styled-components';
import { Body3, Label2 } from '../Text';
import { Carousel } from '../shared';
import { useAreaClick, useOpenPromotedAppInExternalBrowser } from '../../hooks/useAreaClick';
import {
    PromotedItem,
    PromotedItemImage,
    PromotedItemText
} from '../../pages/browser/PromotedItem';
import { useActiveConfig } from '../../state/wallet';

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

export const PromotionsCarousel: FC<
    { apps: CarouselApp[]; onClickApp?: (app: CarouselApp) => void; className?: string } & Partial<
        ComponentProps<typeof Carousel>
    >
> = ({ apps, onClickApp, className, ...rest }) => {
    const config = useActiveConfig();
    const speed = config.featured_play_interval;

    return (
        <Carousel
            className={className}
            gap="8px"
            centerPadding="16px"
            autoplaySpeed={speed}
            {...rest}
        >
            {apps.map(item => (
                <CarouselItem item={item} key={item.url} onClickApp={onClickApp} />
            ))}
        </Carousel>
    );
};

const CarouselItem: FC<{ item: CarouselApp; onClickApp?: (app: CarouselApp) => void }> = ({
    item,
    onClickApp
}) => {
    const openAppCallback = useOpenPromotedAppInExternalBrowser(item.url, 'featured');
    const callback = useCallback(() => {
        if (onClickApp) {
            onClickApp(item);
        } else {
            openAppCallback();
        }
    }, [onClickApp, openAppCallback, item]);

    const ref = useAreaClick({ callback });

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
