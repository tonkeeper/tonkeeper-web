import React, { FC } from 'react';
import styled from 'styled-components';
import { SkeletonImage, SkeletonText } from '../shared/Skeleton';
import { H2 } from '../Text';
import { Body } from './CroppedText';

const Block = styled.div`
    display: flex;
    margin: 1rem 0 2.5rem;
    gap: 1rem;
    width: 100%;
`;

const Text = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
`;

const Image = styled.img`
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    border-radius: 100%;
`;

interface CoinProps {
    amount?: string | number;
    symbol: string;
    price?: string;
    image?: string;
    description?: string;
}

export const CoinInfoSkeleton = () => {
    return (
        <Block>
            <Text>
                <H2>
                    <SkeletonText size="large" />
                </H2>
                <Body open>
                    <SkeletonText width="40px" />
                </Body>
            </Text>
            <SkeletonImage width="64px" />
        </Block>
    );
};

const Title = styled(H2)`
    margin-bottom: 2px;
`;

export const CoinInfo: FC<CoinProps> = ({ amount, symbol, price, image }) => {
    return (
        <Block>
            <Text>
                <Title>
                    {amount} {symbol}
                </Title>
                {price && <Body open>{price}</Body>}
            </Text>
            {image ? <Image src={image} /> : <SkeletonImage width="64px" />}
        </Block>
    );
};
