import { css, styled } from 'styled-components';
import { DesktopViewPageLayout } from '../../components/desktop/DesktopViewLayout';

export const StakingPageWrapper = styled(DesktopViewPageLayout)`
    overflow-y: auto;
    ${p =>
        p.theme.proDisplayType === 'desktop' &&
        css`
            min-width: 480px;
        `}
`;

export const ContentWrapper = styled.div`
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    box-sizing: border-box;
`;
