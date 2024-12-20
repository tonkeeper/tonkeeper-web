import { FC, MouseEventHandler, PropsWithChildren } from 'react';
import { useAppPlatform } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import styled from 'styled-components';

const AStyled = styled.a`
    text-decoration: unset;
    cursor: pointer;
`;

const ButtonStyled = styled.button`
    border: none;
    outline: none;
    background: transparent;
    cursor: pointer;
`;

export const ExternalLink: FC<
    PropsWithChildren<{
        className?: string;
        href: string;
        onClick?: MouseEventHandler;
    }>
> = ({ className, href, onClick, children }) => {
    const platform = useAppPlatform();
    const sdk = useAppSdk();

    if (platform === 'web' || platform === 'swap-widget-web') {
        return (
            <AStyled
                className={className}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => onClick?.(e)}
            >
                {children}
            </AStyled>
        );
    }

    return (
        <ButtonStyled
            onClick={e => {
                onClick?.(e);
                sdk.openPage(href);
            }}
            className={className}
        >
            {children}
        </ButtonStyled>
    );
};
