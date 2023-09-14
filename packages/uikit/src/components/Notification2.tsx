import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import styled from 'styled-components';
import { useAppSdk } from '../hooks/appSdk';
import { ButtonContainer, NotificationCancelButton, NotificationTitleRow } from './Notification';
import ReactPortal from './ReactPortal';

const Splash = styled.div`
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease-in-out;
    overflow: hidden;
    -webkit-overflow-scrolling: touch;
    z-index: 10;
    padding: 0;
    opacity: 0;
    pointer-events: none;

    &.enter-done {
        opacity: 1;
        pointer-events: auto;
    }

    &.exit {
        opacity: 0;
    }
`;

const Content = styled.div`
    width: 100%;
    background-color: ${props => props.theme.backgroundPage};
    border-radius: ${props => props.theme.cornerMedium};
    padding: 1rem;
    flex-shrink: 0;
    box-sizing: border-box;
`;

const CenterBlock = styled.div`
    width: 100%;
    padding-top: 100px;
`;

export const Notification2: FC<{
    isOpen: boolean;
    handleClose: () => void;
    hideButton?: boolean;
    title?: string;
    children: (afterClose: (action?: () => void) => void) => React.ReactNode;
}> = React.memo(({ children, isOpen, hideButton, handleClose, title }) => {
    const [entered, setEntered] = useState(false);

    const sdk = useAppSdk();
    const nodeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const closeOnEscapeKey = (e: KeyboardEvent) => (e.key === 'Escape' ? handleClose() : null);
        document.body.addEventListener('keydown', closeOnEscapeKey);
        return () => {
            document.body.removeEventListener('keydown', closeOnEscapeKey);
        };
    }, [handleClose]);

    const Child = useMemo(() => {
        if (!isOpen) return undefined;
        return children((afterClose?: () => void) => {
            setTimeout(() => afterClose && afterClose(), 300);
            handleClose();
        });
    }, [isOpen, children, handleClose]);

    useEffect(() => {
        const handler = () => {
            const container = document.getElementById('react-portal-modal-container');

            if (container) {
                if (container.childElementCount) {
                    sdk.disableScroll();
                } else {
                    sdk.enableScroll();
                }
            }
        };

        const timer = setTimeout(handler, 0);

        return () => {
            clearTimeout(timer);
            handler();
        };
    }, [isOpen, entered, sdk]);

    return (
        <ReactPortal wrapperId="react-portal-modal-container">
            <CSSTransition
                in={isOpen}
                timeout={{ enter: 0, exit: 300 }}
                unmountOnExit
                nodeRef={nodeRef}
                onEntered={() => setEntered(true)}
                onExited={() => setEntered(false)}
            >
                <Splash ref={nodeRef} className="scrollable">
                    <CenterBlock>
                        <Content>
                            {title && (
                                <NotificationTitleRow handleClose={handleClose}>
                                    {title}
                                </NotificationTitleRow>
                            )}
                            {!hideButton && (
                                <ButtonContainer>
                                    <NotificationCancelButton handleClose={handleClose} />
                                </ButtonContainer>
                            )}
                            {Child}
                        </Content>
                    </CenterBlock>
                </Splash>
            </CSSTransition>
        </ReactPortal>
    );
});

Notification2.displayName = 'Notification2';
