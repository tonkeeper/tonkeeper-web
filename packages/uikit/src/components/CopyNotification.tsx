import React, { FC, useEffect, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import styled from 'styled-components';
import { useAppSdk } from '../hooks/appSdk';
import { useTranslation } from '../hooks/translation';
import ReactPortal from './ReactPortal';
import { Label2 } from './Text';

const Message = styled.div`
    position: fixed;
    z-index: 20;
    top: -30px;
    left: 50%;

    transition: all 0.1s ease-in-out;

    &.enter-done {
        top: 16px;
        opacity: 1;
        pointer-events: auto;
        transform: scale(1);
    }

    &.exit {
        top: -30px;
        opacity: 0;
        transform: scale(0.8);
    }
`;

const Content = styled.div`
    width: auto;
    max-width: calc(var(--app-width) - 1rem);
    word-break: break-all;
    text-align: center;
    padding: 14px 24px 14px;
    box-sizing: border-box;
    background: ${props => props.theme.backgroundContentTint};
    border-radius: ${props => props.theme.cornerLarge};

    margin-left: -50%;
    margin-right: 50%;

    box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.16);
`;

export const CopyNotification: FC<{ hideSimpleCopyNotifications?: boolean }> = React.memo(
    ({ hideSimpleCopyNotifications }) => {
        const { t } = useTranslation();
        const [isOpen, setOpen] = useState<boolean>(false);
        const [text, setText] = useState<string>(t('copied'));
        const sdk = useAppSdk();

        useEffect(() => {
            let timer: NodeJS.Timeout | null = null;
            const handler = (options: {
                method: 'copy';
                id?: number | undefined;
                params: string;
            }) => {
                if (timer) {
                    clearTimeout(timer);
                }

                if (hideSimpleCopyNotifications && !options.params) {
                    return;
                    // hide 'Copy' notification
                }

                setText(options.params ?? t('copied'));
                setOpen(true);
                timer = setTimeout(() => {
                    setOpen(false);
                }, 2000);
            };
            sdk.uiEvents.on('copy', handler);
            return () => {
                sdk.uiEvents.off('copy', handler);
            };
        }, [hideSimpleCopyNotifications]);

        const nodeRef = useRef(null);

        return (
            <ReactPortal wrapperId="react-copy-modal">
                <CSSTransition
                    in={isOpen}
                    timeout={{ enter: 0, exit: 300 }}
                    unmountOnExit
                    nodeRef={nodeRef}
                >
                    <Message onClick={() => setOpen(false)} ref={nodeRef}>
                        <Content>
                            <Label2 onClick={() => sdk.copyToClipboard(text)}>{text}</Label2>
                        </Content>
                    </Message>
                </CSSTransition>
            </ReactPortal>
        );
    }
);
CopyNotification.displayName = 'CopyNotification';
