import { FC, MouseEventHandler, PropsWithChildren } from 'react';
import { useAppPlatform } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import styled from 'styled-components';

const AStyled = styled.a<{ $contents?: boolean }>`
    text-decoration: unset;
    cursor: pointer;

    ${p => p.$contents && 'display: contents'};
`;

const ButtonStyled = styled.button<{ $contents?: boolean }>`
    border: none;
    outline: none;
    background: transparent;
    cursor: pointer;

    ${p => p.$contents && 'display: contents'};
`;

export const ExternalLink: FC<
    PropsWithChildren<{
        className?: string;
        href: string;
        onClick?: MouseEventHandler;
        contents?: boolean;
    }>
> = ({ className, href, onClick, children, contents }) => {
    const platform = useAppPlatform();
    const sdk = useAppSdk();

    if (platform === 'web' || platform === 'swap_widget_web') {
        return (
            <AStyled
                className={className}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => onClick?.(e)}
                $contents={contents}
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
            $contents={contents}
        >
            {children}
        </ButtonStyled>
    );
};
