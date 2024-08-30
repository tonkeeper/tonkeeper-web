import styled, { css } from 'styled-components';
import { BorderSmallResponsive } from '../shared/Styles';
import { ComponentProps, FC } from 'react';
import { DropDown } from '../DropDown';

const DropDownStyled = styled(DropDown)<{
    width?: string;
    maxHeight?: string;
    right?: string;
    top?: string;
    bottom?: string;
}>`
    width: 100%;

    .dd-select-container {
        ${p => css`
            ${p.width && `width: ${p.width};`}
            ${p.maxHeight && `max-height: ${p.maxHeight};`}
            ${p.right && `right: ${p.right};`}
            ${p.top && `top: ${p.top};`}
            ${p.bottom && `bottom: ${p.bottom};`}
        `}
    }
`;

export const SelectDropDown: FC<
    {
        width?: string;
        maxHeight?: string;
        right?: string;
        top?: string;
        bottom?: string;
    } & ComponentProps<typeof DropDown>
> = props => {
    const { containerClassName, ...rest } = props;
    const customContainerClass = containerClassName ? ' ' + containerClassName : '';
    return (
        <DropDownStyled
            {...rest}
            containerClassName={'dd-select-container' + customContainerClass}
        />
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
