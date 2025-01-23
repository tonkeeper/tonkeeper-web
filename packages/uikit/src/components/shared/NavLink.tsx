import React from 'react';
import { NavLink as ReactRouterNavLink, useLocation } from 'react-router-dom';
import { useAppTargetEnv } from '../../hooks/appSdk';
import { useNavigate } from '../../hooks/router/useNavigate';

interface CustomNavLinkProps {
    to: string;
    children: ({ isActive }: { isActive: boolean }) => React.ReactNode;
    className?: string;
    activeClassName?: string;
    exact?: boolean;
    end?: boolean;
    replace?: boolean;
}

export const NavLink: React.FC<CustomNavLinkProps> = ({
    to,
    children,
    className = '',
    activeClassName = 'active',
    exact = false,
    end = false,
    replace
}) => {
    const location = useLocation();

    const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
    const env = useAppTargetEnv();
    const navigate = useNavigate();

    if (env === 'mobile') {
        return (
            <div
                className={`${className} ${isActive ? activeClassName : ''}`}
                onClick={() => navigate(to, { replace })}
            >
                {children({ isActive })}
            </div>
        );
    }

    return (
        <ReactRouterNavLink
            to={to}
            className={`${className} ${isActive ? activeClassName : ''}`}
            exact={exact} // This can still be passed in case of explicit exact matching
            replace={replace}
        >
            {children({ isActive })}
        </ReactRouterNavLink>
    );
};
