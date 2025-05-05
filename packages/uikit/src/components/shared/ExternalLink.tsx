import { FC, MouseEventHandler, PropsWithChildren } from 'react';
import { useAppSdk, useAppTargetEnv } from '../../hooks/appSdk';
import styled, { css } from 'styled-components';
import { isValidUrlProtocol } from '@tonkeeper/core/dist/utils/common';

const AStyled = styled.a<{ $contents?: boolean; $colored?: boolean }>`
    text-decoration: unset;
    cursor: pointer;

    ${p => p.$contents && 'display: contents'};
    ${p =>
        p.$colored &&
        css`
            color: ${p.theme.accentBlueConstant};

            > * {
                color: ${p.theme.accentBlueConstant};
            }
        `};
`;

const ButtonStyled = styled.button<{ $contents?: boolean; $colored?: boolean }>`
    border: none;
    outline: none;
    background: transparent;
    cursor: pointer;

    ${p => p.$contents && 'display: contents'};
    ${p =>
        p.$colored &&
        css`
            color: ${p.theme.accentBlueConstant};

            > * {
                color: ${p.theme.accentBlueConstant};
            }
        `};
`;

export const ExternalLink: FC<
    PropsWithChildren<{
        className?: string;
        href: string;
        onClick?: MouseEventHandler;
        contents?: boolean;
        colored?: boolean;
    }>
> = ({ className, href, onClick, children, contents, colored }) => {
    const platform = useAppTargetEnv();
    const sdk = useAppSdk();

    if (platform === 'web' || platform === 'swap_widget_web') {
        if (!isValidUrlProtocol(href, sdk.authorizedOpenUrlProtocols)) {
            return null;
        }

        return (
            <AStyled
                className={className}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => onClick?.(e)}
                $contents={contents}
                $colored={colored}
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
            $colored={colored}
        >
            {children}
        </ButtonStyled>
    );
};
