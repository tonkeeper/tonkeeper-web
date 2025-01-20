import React from 'react';
import { NavLink as ReactRouterNavLink, useLocation } from 'react-router-dom';

interface CustomNavLinkProps {
    to: string;
    children: ({ isActive }: { isActive: boolean }) => React.ReactNode;
    className?: string;
    activeClassName?: string;
    exact?: boolean;
    end?: boolean;
}

export const NavLink: React.FC<CustomNavLinkProps> = ({
    to,
    children,
    className = '',
    activeClassName = 'active',
    exact = false,
    end = false
}) => {
    const location = useLocation();

    const isActive = end ? location.pathname === to : location.pathname.startsWith(to);

    return (
        <ReactRouterNavLink
            to={to}
            className={`${className} ${isActive ? activeClassName : ''}`}
            exact={exact} // This can still be passed in case of explicit exact matching
        >
            {children({ isActive })}
        </ReactRouterNavLink>
    );
};
