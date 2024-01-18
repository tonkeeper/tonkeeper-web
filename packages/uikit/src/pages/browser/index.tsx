import { FC } from 'react';
import { Carousel } from '../../components/shared';
import styled from 'styled-components';

const CarouselCard = styled.div`
    width: 448px;
    height: 224px;
    background: aquamarine;
    display: flex;
    align-items: center;
    justify-content: center;
    color: red;
`;

const BrowserPage: FC = () => {
    return (
        <div>
            <Carousel gap="8px" itemWidth="448px">
                <CarouselCard>1</CarouselCard>
                <CarouselCard>2</CarouselCard>
                <CarouselCard>3</CarouselCard>
            </Carousel>
        </div>
    );
};

export default BrowserPage;
