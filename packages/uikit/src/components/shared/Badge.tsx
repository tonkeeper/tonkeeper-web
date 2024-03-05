import { FC, PropsWithChildren } from 'react';
import styled from 'styled-components';
import { hexToRGBA } from '../../libs/css';

const BadgeStyled = styled.div<{ color: string }>`
    padding: 3px 5px;
    color: ${p => p.theme[p.color]};
    border-radius: ${p => p.theme.corner3xSmall};
    background-color: ${p => hexToRGBA(p.theme[p.color], 0.16)};
    text-transform: uppercase;

    font-style: normal;
    font-weight: 600;
    font-size: 10px;
    line-height: 14px;
`;

export const Badge: FC<PropsWithChildren<{ className?: string; color?: string }>> = ({
    color,
    className,
    children
}) => {
    return (
        <BadgeStyled className={className} color={color || 'accentBlue'}>
            {children}
        </BadgeStyled>
    );
};
