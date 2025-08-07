import { css, styled } from 'styled-components';
import { BorderSmallResponsive } from './Styles';
import { Body3Class } from '../Text';

export const Tooltip = styled.div<{ placement: 'top' | 'bottom' }>`
    transform: translate3d(0, -10px, 0);
    z-index: 100;
    left: 0;
    right: 0;
    transition: all 0.15s ease-in-out;
    opacity: 0;
    position: absolute;
    background-color: ${p => p.theme.backgroundContentTint};
    padding: 8px 12px;
    ${BorderSmallResponsive};
    ${Body3Class};

    ${p =>
        p.placement === 'top'
            ? css`
                  transform: translate3d(0, 10px, 0);
                  bottom: 30px;
              `
            : css`
                  transform: translate3d(0, -10px, 0);
                  top: 30px;
              `}
`;

export const TooltipHost = styled.div`
    cursor: pointer;

    &:hover + ${Tooltip} {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
`;
