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

export const Link: FC<ComponentProps<typeof RouterLink>> = props => {
    const env = useAppTargetEnv();
    const navigate = useNavigate();

    if (env === 'mobile') {
        return (
            <div
                {...(props as DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>)}
                onClick={e => {
                    props.onClick?.(e as unknown as ReactMouseEvent<HTMLAnchorElement, MouseEvent>);
                    navigate(props.to as string, { replace: props.replace });
                }}
            />
        );
    }

    return <RouterLink {...props} />;
};
