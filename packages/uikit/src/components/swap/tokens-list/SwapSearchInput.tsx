import { styled } from 'styled-components';
import { Body2Class } from '../../Text';
import { FC } from 'react';

const SearchTokenInputElement = styled.input`
    border-radius: ${p =>
        p.theme.displayType === 'full-width' ? p.theme.corner2xSmall : p.theme.cornerSmall};
    border: 1px solid transparent;
    outline: none;
    width: 100%;
    box-sizing: border-box;

    background-color: ${p => p.theme.fieldBackground};
    padding: 8px 0 8px 12px;

    ${Body2Class}

    &::placeholder {
        color: ${p => p.theme.textTertiary};
    }

    transition: border-color 0.15s ease-in-out;
    &:focus {
        border: 1px solid ${p => p.theme.accentBlue};
    }
    &:disabled {
        opacity: 0.5;
    }
    color: ${p => p.theme.textPrimary};
`;

export const SwapSearchInput: FC<{ className?: string; isDisabled: boolean }> = ({
    className,
    isDisabled
}) => {
    return (
        <SearchTokenInputElement disabled={isDisabled} className={className} placeholder="Search" />
    );
};
