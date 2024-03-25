import styled from 'styled-components';
import React, { FC, ReactNode, useCallback } from 'react';
import { useAppSdk } from '../../hooks/appSdk';
import { useNavigate } from 'react-router-dom';
import { useNativeBackButton } from '../BackButton';
import { ArrowLeftIcon } from '../Icon';
import { IconButton } from '../fields/IconButton';

export const DesktopViewPageLayout = styled.div`
    padding-top: 0.5rem;
    overflow: auto;
`;

export const DesktopViewHeaderStyled = styled.div<{ withBackButton?: boolean }>`
    padding: 0 1rem 0 ${props => (props.withBackButton ? '0' : '1rem')};
    height: 36px;
    display: flex;
    align-items: center;
    box-sizing: border-box;
`;

const IconButtonStyled = styled(IconButton)`
    transition: opacity 0.2s ease-in-out;

    &:hover {
        opacity: 0.64;
    }
`;

export const DesktopViewDivider = styled.div`
    height: 1px;
    background-color: ${p => p.theme.separatorCommon};
`;

const BackButton: FC<{ className?: string }> = ({ className }) => {
    const sdk = useAppSdk();
    const navigate = useNavigate();
    const back = useCallback(() => navigate(-1), [navigate]);
    useNativeBackButton(sdk, back);

    if (sdk.nativeBackButton) {
        return <></>;
    } else {
        return (
            <IconButtonStyled onClick={() => navigate(-1)} className={className} transparent>
                <ArrowLeftIcon />
            </IconButtonStyled>
        );
    }
};

const BackButtonStyled = styled(BackButton)`
    padding: 0 1rem;
    height: 100%;
`;

export const DesktopViewHeader: FC<{
    children: ReactNode;
    backButton?: boolean;
    className?: string;
}> = ({ children, backButton, className }) => {
    return (
        <DesktopViewHeaderStyled withBackButton={backButton} className={className}>
            {backButton && <BackButtonStyled />}
            {children}
        </DesktopViewHeaderStyled>
    );
};
