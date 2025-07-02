import styled, { css } from 'styled-components';
import { hexToRGBA } from '../../libs/css';

/**
 * Need to be a 'div' instead of 'button' to provide correct dnd behavior
 */
export const AsideMenuItem = styled.div<{ isSelected: boolean }>`
    background: ${p =>
        p.isSelected
            ? p.theme.proDisplayType === 'desktop'
                ? p.theme.backgroundContentTint
                : p.theme.backgroundContent
            : 'transparent'};
    border-radius: ${p => p.theme.corner2xSmall};
    box-sizing: border-box;
    cursor: pointer;

    padding: 6px 10px;
    width: 100%;
    height: 36px;
    min-height: 36px;
    display: flex;
    align-items: center;
    gap: 10px;

    & > * {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
    }

    ${p =>
        p.theme.proDisplayType !== 'mobile' &&
        css`
            @media (pointer: fine) {
                &:hover {
                    background: ${p => hexToRGBA(p.theme.backgroundContentTint, 0.56)};
                }
            }
        `}
`;
