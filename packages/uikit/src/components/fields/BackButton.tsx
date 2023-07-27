import styled from 'styled-components';

export const ButtonMock = styled.div`
    flex-shrink: 0;

    cursor: pointer;
    width: 2rem;
    height: 2rem;
`;

export const BackButton = styled(ButtonMock)`
    border-radius: ${props => props.theme.cornerFull};
    color: ${props => props.theme.textPrimary};
    background-color: ${props => props.theme.backgroundContent};
    transition: background-color 0.1s ease;
    display: flex;
    justify-content: center;
    align-items: center;

    &:hover {
        background-color: ${props => props.theme.backgroundContentTint};
    }
`;
