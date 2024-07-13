import styled from 'styled-components';

export const IconButton = styled.button<{ transparent?: boolean }>`
    cursor: pointer;
    width: fit-content;
    height: fit-content;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${props => props.theme.cornerFull};
    padding: 2px;
    color: ${props => props.theme.textPrimary};
    background-color: ${props =>
        props.transparent ? 'transparent' : props.theme.backgroundContent};
    transition: background-color 0.1s ease;

    &:hover {
        background-color: ${props =>
            props.transparent ? 'transparent' : props.theme.backgroundContentTint};
    }
    border: none;
`;

export const IconButtonTransparentBackground = styled(IconButton)`
    padding: 10px;
    border: none;

    > svg {
        color: ${props => props.theme.iconSecondary};
    }

    background-color: transparent;

    transition: opacity 0.15s ease-in-out;

    &:hover {
        opacity: 0.64;
        background-color: transparent;
    }
`;
