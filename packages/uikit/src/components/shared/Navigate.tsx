import { ComponentProps, FC } from 'react';
import { Redirect } from 'react-router-dom';

export const Navigate: FC<{ to: ComponentProps<typeof Redirect>['to']; replace?: boolean }> = ({
    to,
    replace
}) => {
    if (replace) {
        return (
            <Redirect
                to={{
                    state: { replace: true },
                    ...(typeof to === 'string' ? { pathname: to } : to)
                }}
            />
        );
    } else {
        return <Redirect to={to} />;
    }
};
