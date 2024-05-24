import { IconButton } from '../../fields/IconButton';
import { RefreshIcon } from '../../Icon';
import { useCalculatedSwap } from '../../../state/swap/useCalculatedSwap';
import { styled } from 'styled-components';

const IconButtonStyled = styled(IconButton)`
    padding: 10px;
    border: none;

    > svg {
        color: ${props => props.theme.iconSecondary};
    }
`;

export const SwapRefreshButton = () => {
    const { refetch } = useCalculatedSwap();
    return (
        <IconButtonStyled transparent onClick={() => refetch()}>
            <RefreshIcon />
        </IconButtonStyled>
    );
};
