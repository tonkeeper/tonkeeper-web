import { IconButton } from '../../fields/IconButton';
import { SlidersIcon } from '../../Icon';
import { styled } from 'styled-components';

const IconButtonStyled = styled(IconButton)`
    padding: 10px;
    border: none;

    > svg {
        color: ${props => props.theme.iconSecondary};
    }
`;

export const SwapSettingsButton = () => {
    return (
        <IconButtonStyled transparent>
            <SlidersIcon />
        </IconButtonStyled>
    );
};
