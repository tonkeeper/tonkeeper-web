import React, { FC, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { Body2 } from '../Text';

export const Body = styled(Body2)<{ open: boolean; margin?: 'small' | 'last' }>`
    color: ${props => props.theme.textSecondary};
    margin-bottom: 0.75rem;

    word-break: break-word;

    ${props => {
        switch (props.margin) {
            case 'small':
                return css`
                    margin-bottom: 0.25rem;
                `;
            case 'last':
                return css`
                    margin-bottom: 0;
                `;
            default:
                return css`
                    margin-bottom: 0.75rem;
                `;
        }
    }}

    ${props =>
        !props.open &&
        css`
            max-height: 40px;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            position: relative;
        `}
`;

const More = styled.span<{ contentColor?: boolean }>`
    cursor: pointer;
    color: ${props => props.theme.textAccent};
    position: absolute;
    bottom: 0;
    right: 0;
    padding-left: 2rem;

    background: linear-gradient(
        90deg,
        rgba(16, 22, 31, 0) 0%,
        ${props =>
                props.contentColor ? props.theme.backgroundContent : props.theme.backgroundPage}
            20%
    );
`;

export const CroppedBodyText: FC<{
    text: string;
    margin?: 'small' | 'last';
    contentColor?: boolean;
}> = ({ text, margin, contentColor }) => {
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();

    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (ref.current) {
            if (ref.current.scrollHeight === ref.current.clientHeight) {
                setOpen(true);
            }
        }
    }, [ref]);
    return (
        <Body ref={ref} onClick={() => setOpen(true)} open={open} margin={margin}>
            {text}
            {open ? undefined : <More contentColor={contentColor}>{t('nft_more')}</More>}
        </Body>
    );
};
