import React, { FC } from 'react';
import styled from 'styled-components';
import { GlobIcon } from '../Icon';

export const ButtonMock = styled.div`
    flex-shrink: 0;

    cursor: pointer;
    width: 2rem;
    height: 2rem;

    border-radius: ${props => props.theme.cornerFull};
`;

const CountryElement = styled.div`
    width: 16px;
    height: 16px;
    border-radius: ${props => props.theme.cornerFull};
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
`;

export const CountryIcon: FC<{ country: string }> = ({ country }) => {
    return (
        <CountryElement
            style={{
                backgroundImage: `url('https://purecatamphetamine.github.io/country-flag-icons/3x2/${country}.svg')`
            }}
        />
    );
};

export const CommonCountryButton: FC<{
    country: string | undefined | null;
    onClick: () => void;
}> = ({ country, onClick }) => {
    return (
        <RoundedButton onClick={onClick}>
            {country ? <CountryIcon country={country} /> : <GlobIcon />}
        </RoundedButton>
    );
};

export const RoundedButton = styled(ButtonMock)`
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
