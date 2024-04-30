import styled from 'styled-components';
import { InputBlock, InputField } from '../../fields/Input';

export const InputBlockStyled = styled(InputBlock)`
    min-height: unset;
    height: fit-content;
    padding: 0 12px;
    border-radius: ${p => p.theme.corner2xSmall};
    display: flex;
    align-items: center;
`;

export const InputFieldStyled = styled(InputField)`
    width: 100%;
    padding: 8px 0;
    height: 36px;
    box-sizing: content-box;
    font-family: ${p => p.theme.fontMono};
`;
