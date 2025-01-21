import styled from 'styled-components';

export const MobileProHeaderContainer = styled.div`
    box-sizing: content-box;
    padding: calc(env(safe-area-inset-top) + 8px) 8px 8px;
    background: ${p => p.theme.backgroundContent};
    height: 36px;
`;
