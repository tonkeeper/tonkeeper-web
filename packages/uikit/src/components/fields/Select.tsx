import styled, { createGlobalStyle, css } from 'styled-components';
import { BorderSmallResponsive } from '../shared/Styles';
import { ComponentProps, FC, useId } from 'react';
import { DropDown } from '../DropDown';

const DropDownStyled = styled(DropDown)`
    width: 100%;
`;

const DropDownContainerClass = createGlobalStyle<{
    width?: string;
    maxHeight?: string;
    right?: string;
    left?: string;
    top?: string;
    bottom?: string;
    $id: string;
}>`
    ${p => css`
        .dd-select-container_${p.$id} {
            ${css`
                ${p.width && `width: ${p.width};`}
                ${p.maxHeight && `max-height: ${p.maxHeight};`}
            ${p.right && `right: ${p.right};`}
            ${p.left && `left: ${p.left};`}
            ${p.top && `top: ${p.top};`}
            ${p.bottom &&
                css`
                    bottom: ${p.bottom};
                    ${!p.top && 'top: unset;'}
                `}
            `}
        }
    `}
`;

export const SelectDropDown: FC<
    {
        width?: string;
        maxHeight?: string;
        right?: string;
        left?: string;
        top?: string;
        bottom?: string;
    } & ComponentProps<typeof DropDown>
> = props => {
    const { containerClassName, ...rest } = props;
    const customContainerClass = containerClassName ? ' ' + containerClassName : '';

    const id = useId().replaceAll(':', '_');

    return (
        <>
            <DropDownContainerClass {...props} $id={id} />
            <DropDownStyled
                {...rest}
                containerClassName={
                    `dd-select-container dd-select-container_${id}` + customContainerClass
                }
            />
        </>
    );
};

export const SelectField = styled.div`
    background: ${p => p.theme.fieldBackground};
    ${BorderSmallResponsive};
`;

export const SelectDropDownHost = styled.div<{ isErrored?: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    ${BorderSmallResponsive};
    ${p =>
        p.isErrored &&
        css`
            border: 1px solid ${p.theme.fieldErrorBorder};
            background: ${p.theme.fieldErrorBackground};
        `}
`;

export const SelectDropDownHostText = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;

    > :first-child {
        color: ${p => p.theme.textSecondary};
    }
`;
