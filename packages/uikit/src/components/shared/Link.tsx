import { Link as RouterLink } from 'react-router-dom';
import { useAppTargetEnv } from '../../hooks/appSdk';
import {
    ComponentProps,
    DetailedHTMLProps,
    FC,
    HTMLAttributes,
    MouseEvent as ReactMouseEvent
} from 'react';
import { useNavigate } from '../../hooks/router/useNavigate';
import styled from 'styled-components';

export const Link: FC<ComponentProps<typeof RouterLink> & { contents?: boolean }> = props => {
    const env = useAppTargetEnv();
    const navigate = useNavigate();

    if (env === 'mobile') {
        return (
            <MobileRouterLinkStyled
                {...(props as DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>)}
                onClick={e => {
                    props.onClick?.(e as unknown as ReactMouseEvent<HTMLAnchorElement, MouseEvent>);
                    navigate(props.to as string, { replace: props.replace });
                }}
            />
        );
    }

    return <RouterLinkStyled {...props} />;
};

const RouterLinkStyled = styled(RouterLink)<{ contents?: boolean }>`
    ${p => p.contents && 'display: contents'};
    color: inherit;
`;

const MobileRouterLinkStyled = styled.div<{ contents?: boolean }>`
    ${p => p.contents && 'display: contents'};
    color: inherit;
`;
