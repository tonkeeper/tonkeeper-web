import { styled } from 'styled-components';
import { BorderSmallResponsive } from './Styles';

export const ToggleButton = styled.div`
    width: fit-content;
    gap: 4px;
    ${BorderSmallResponsive};
    background-color: ${p => p.theme.fieldBackground};
    padding: 4px;
    display: flex;
`;

export const ToggleButtonItem = styled.button<{ active: boolean }>`
    cursor: pointer;
    ${BorderSmallResponsive};
    border: none;
    background-color: ${p => (p.active ? p.theme.backgroundContentAttention : 'transparent')};
    padding: 6px 8px;
    transition: background-color 0.1s ease-in-out;
`;
