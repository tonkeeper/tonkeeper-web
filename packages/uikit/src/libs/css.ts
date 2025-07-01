import { css } from 'styled-components';

export function hexToRGBA(hex: string, alpha?: string | number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    if (alpha) {
        return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
    } else {
        return 'rgb(' + r + ', ' + g + ', ' + b + ')';
    }
}

export const hover = (...params: Parameters<typeof css>): ReturnType<typeof css> => css`
    @media (pointer: fine) {
        &:hover {
            ${css(...params)}
        }
    }
`;
export const cn = (...classNames: (string | undefined | boolean)[]) =>
    classNames.filter(Boolean).join(' ');

export const iosKeyboardTransition = '0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
