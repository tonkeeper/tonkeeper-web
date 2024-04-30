import styled, { css } from 'styled-components';
import React, { FC, ReactNode, useCallback } from 'react';
import { useAppSdk } from '../../hooks/appSdk';
import { useNavigate } from 'react-router-dom';
import { useNativeBackButton } from '../BackButton';
import { ArrowLeftIcon } from '../Icon';
import { IconButton } from '../fields/IconButton';

export const DesktopViewPageLayout = styled.div<{ borderBottom?: boolean }>`
    overflow: auto;
`;

export const DesktopViewHeaderStyled = styled.div<{
    withBackButton?: boolean;
    borderBottom?: boolean;
}>`
    padding: 1rem 1rem 1rem ${props => (props.withBackButton ? '0' : '1rem')};
    height: 20px;
    display: flex;
    align-items: center;
    box-sizing: content-box;
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: ${p => p.theme.backgroundPage};

    border-bottom: 1px solid transparent;
    transition: border-bottom-color 0.15s ease-in-out;

    * {
        user-select: none;
    }

    ${props =>
        props.borderBottom &&
        css`
            border-bottom-color: ${props.theme.separatorCommon};
        `};
`;

const IconButtonStyled = styled(IconButton)`
    transition: opacity 0.15s ease-in-out;

    &:hover {
        opacity: 0.64;
    }
`;

export const DesktopViewDivider = styled.div`
    height: 1px;
    background-color: ${p => p.theme.separatorCommon};
`;

export const DesktopBackButton: FC<{
    className?: string;
    icon?: ReactNode;
    onBack?: () => void;
}> = ({ className, icon, onBack }) => {
    const sdk = useAppSdk();
    const navigate = useNavigate();
    const back = useCallback(() => (onBack ? onBack() : navigate(-1)), [navigate, onBack]);
    useNativeBackButton(sdk, back);

    if (sdk.nativeBackButton) {
        return <></>;
    } else {
        return (
            <IconButtonStyled onClick={back} className={className} transparent>
                {icon || <ArrowLeftIcon />}
            </IconButtonStyled>
        );
    }
};

const BackButtonStyled = styled(DesktopBackButton)`
    padding: 0 1rem;
    height: 2rem;
`;

export const DesktopViewHeader: FC<{
    children: ReactNode;
    backButton?: boolean | ReactNode;
    className?: string;
    borderBottom?: boolean;
}> = ({ children, backButton, borderBottom, className }) => {
    return (
        <DesktopViewHeaderStyled
            withBackButton={!!backButton}
            className={className}
            borderBottom={borderBottom}
        >
            {backButton && typeof backButton === 'boolean' ? <BackButtonStyled /> : backButton}
            {children}
        </DesktopViewHeaderStyled>
    );
};
