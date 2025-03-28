import styled from 'styled-components';
import { FC, PropsWithChildren } from 'react';
import { useNavigate } from '../../../hooks/router/useNavigate';
import { IconButtonTransparentBackground } from '../../fields/IconButton';
import { ChevronLeftIcon } from '../../Icon';
import { Label2 } from '../../Text';

export const MobileProHeaderContainer = styled.div`
    box-sizing: content-box;
    padding: calc(env(safe-area-inset-top) + 8px) 8px 8px;
    height: 36px;
`;

const MobileProHeaderContainerStyled = styled(MobileProHeaderContainer)`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    ${IconButtonTransparentBackground} {
        position: absolute;
        top: calc(env(safe-area-inset-top) + 8px);
        left: 8px;
    }
`;

export const MobileProHeaderContentSimple: FC<PropsWithChildren> = ({ children }) => {
    const navigate = useNavigate();
    return (
        <MobileProHeaderContainerStyled>
            <IconButtonTransparentBackground onClick={() => navigate(-1)}>
                <ChevronLeftIcon />
            </IconButtonTransparentBackground>
            <Label2>{children}</Label2>
        </MobileProHeaderContainerStyled>
    );
};
