import styled, { css } from 'styled-components';
import React, { FC } from 'react';
import { randomIntFromInterval } from '../../libs/common';

function randomWidth() {
    return randomIntFromInterval(30, 90) + '%';
}

const Base = styled.div`
    display: inline-block;

    @keyframes placeHolderShimmer {
        0% {
            background-position: -800px 0;
        }
        100% {
            background-position: 800px 0;
        }
    }

    animation-duration: 2s;
    animation-fill-mode: forwards;
    animation-iteration-count: infinite;
    animation-name: placeHolderShimmer;
    animation-timing-function: linear;
    background-color: #f6f7f8;
    background: linear-gradient(to right, #4f5a70 8%, #bbbbbb 18%, #4f5a70 33%);
    background-size: 800px 104px;

    opacity: 0.1;

    position: relative;
`;
const Block = styled(Base)<{ size?: string; width?: string }>`
    border-radius: ${props => props.theme.corner3xSmall};

    ${props => css`
        width: ${props.width ?? randomWidth()};
    `}

    ${props => {
        switch (props.size) {
            case 'large':
                return css`
                    height: 1.5rem;
                `;
            case 'small':
                return css`
                    height: 0.5rem;
                `;
            default:
                return css`
                    height: 1rem;
                `;
        }
    }}
`;

export const SkeletonText: FC<{ size?: 'large' | 'small'; width?: string; className?: string }> =
    React.memo(({ size, width, className }) => {
        return <Block size={size} width={width} className={className} />;
    });

export const Skeleton = styled(Base)<{
    width: string;
    height?: string;
    borderRadius?: string;
    margin?: string;
    marginBottom?: string;
}>`
    display: block;
    border-radius: ${props =>
        props.borderRadius
            ? props.theme[props.borderRadius] || props.theme.corner3xSmall
            : props.theme.corner3xSmall};

    ${props => css`
        width: ${props.width ?? '3rem'};
        height: ${props.height ?? '20px'};
        ${props.margin && `margin: ${props.margin};`}
        ${props.marginBottom && `margin-bottom: ${props.marginBottom};`}
    `}
`;

const Image = styled(Base)<{ width?: string }>`
    border-radius: ${props => props.theme.cornerFull};

    ${props => css`
        width: ${props.width ?? '44px'};
        height: ${props.width ?? '44px'};
    `}
`;

export const SkeletonImage: FC<{ width?: string }> = React.memo(({ width }) => {
    return <Image width={width} />;
});
