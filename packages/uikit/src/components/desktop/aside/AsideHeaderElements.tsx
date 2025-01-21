import styled, { css } from 'styled-components';

export const AsideHeaderContainer = styled.div<{ width: number }>`
    box-sizing: border-box;
    width: ${p => p.width}px;
    padding: 1rem 1rem 0 0;
    background: ${p => p.theme.backgroundContent};
    height: fit-content;

    ${p =>
        p.theme.proDisplayType === 'desktop' &&
        css`
            border-bottom: 1px solid ${p.theme.backgroundContentAttention};
            padding: 1rem;
            height: 69px;
        `}
`;
