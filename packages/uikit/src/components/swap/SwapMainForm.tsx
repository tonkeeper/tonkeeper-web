import { styled } from 'styled-components';
import { SwapFromField } from './SwapFromField';
import { SwapToField } from './SwapToField';

const MainFormWrapper = styled.div`
    max-width: 292px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

export const SwapMainForm = () => {
    return (
        <MainFormWrapper>
            <SwapFromField />
            <SwapToField />
        </MainFormWrapper>
    );
};
