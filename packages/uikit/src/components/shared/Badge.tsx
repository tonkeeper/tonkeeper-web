import { FC, PropsWithChildren } from 'react';
import styled, { css } from 'styled-components';
import { hexToRGBA } from '../../libs/css';

const BadgeStyled = styled.div<{
    color: string;
    display: string;
    size: 'm' | 's';
    background?: string;
}>`
    display: ${p => p.display};
    flex-shrink: 0;

    ${p =>
        p.size === 'm'
            ? css`
                  padding: 3px 5px;
                  border-radius: ${p.theme.corner3xSmall};
                  font-weight: 600;
                  font-size: 10px;
                  line-height: 14px;
              `
            : css`
                  padding: 2px 4px;
                  border-radius: 3px;
                  font-size: 9px;
                  font-style: normal;
                  font-weight: 510;
                  line-height: 12px;
              `}

    color: ${p => p.theme[p.color]};
    background-color: ${p =>
        p.background ? p.theme[p.background] : hexToRGBA(p.theme[p.color], 0.16)};
    text-transform: uppercase;

    font-style: normal;
`;

export const Badge: FC<
    PropsWithChildren<{
        className?: string;
        color?: string;
        display?: string;
        size?: 'm' | 's';
        background?: string;
    }>
> = ({ color, className, children, display = 'block', size = 'm' }) => {
    return (
        <BadgeStyled
            className={className}
            color={color || 'accentBlue'}
            display={display}
            size={size}
        >
            {children}
        </BadgeStyled>
    );
};
