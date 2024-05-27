import { styled } from 'styled-components';
import { BorderSmallResponsive } from './Styles';
import { Body2Class } from '../Text';
import React, { forwardRef, useId } from 'react';

const LabelStyled = styled.label`
    cursor: pointer;
    ${BorderSmallResponsive};
    ${Body2Class};
    box-sizing: border-box;

    text-align: center;

    padding: 8px 12px;

    background: ${p => p.theme.fieldBackground};
    border: 1px solid transparent;
    transition: border-color 0.15s ease-in-out;
`;
const InputStyled = styled.input`
    display: none;

    &:checked + ${LabelStyled} {
        border: 1px solid ${p => p.theme.accentBlue};
    }
`;

export const RadioFlatInput = forwardRef<HTMLInputElement, React.JSX.IntrinsicElements['input']>(
    (props, ref) => {
        const fallbackId = useId();
        const id = props.id || fallbackId;
        const { className, children, ...rest } = props;

        return (
            <>
                <InputStyled type="radio" ref={ref} id={id} {...rest} />
                <LabelStyled className={className} htmlFor={id}>
                    {children}
                </LabelStyled>
            </>
        );
    }
);
