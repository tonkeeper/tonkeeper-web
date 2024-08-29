import styled from 'styled-components';

export const AsideHeaderContainer = styled.div<{ width: number }>`
    box-sizing: border-box;
    width: ${p => p.width}px;
    padding: 1rem;
    border-bottom: 1px solid ${p => p.theme.backgroundContentAttention};
    background: ${p => p.theme.backgroundContent};
    height: 69px;
`;
