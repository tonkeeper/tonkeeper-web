import { css } from 'styled-components';

export const BorderSmallResponsive = css`
    border-radius: ${p =>
        p.theme.displayType === 'full-width' ? p.theme.corner2xSmall : p.theme.cornerSmall};
`;
