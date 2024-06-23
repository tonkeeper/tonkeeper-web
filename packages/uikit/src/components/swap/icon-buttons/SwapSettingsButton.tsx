import { IconButton } from '../../fields/IconButton';
import { SlidersIcon } from '../../Icon';
import { styled } from 'styled-components';
import { SwapSettingsNotification } from '../SwapSettingsNotification';
import { useState } from 'react';

const IconButtonStyled = styled(IconButton)`
    padding: 10px;
    border: none;

    > svg {
        color: ${props => props.theme.iconSecondary};
    }

    transition: opacity 0.15s ease-in-out;

    &:hover {
        opacity: 0.64;
    }
`;

export const SwapSettingsButton = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <IconButtonStyled transparent onClick={() => setIsOpen(true)}>
                <SlidersIcon />
            </IconButtonStyled>
            <SwapSettingsNotification isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};
