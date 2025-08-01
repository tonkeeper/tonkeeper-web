import React, {
    Children,
    createContext,
    FC,
    forwardRef,
    Fragment,
    PropsWithChildren,
    ReactElement,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import { createPortal } from 'react-dom';
import { CSSTransition } from 'react-transition-group';
import styled, { css, useTheme } from 'styled-components';
import { useAppSdk, useAppTargetEnv } from '../hooks/appSdk';
import { useClickOutside } from '../hooks/useClickOutside';
import { useIsFullWidthMode } from '../hooks/useIsFullWidthMode';
import { Container } from '../styles/globalStyle';
import { RoundedButton, ButtonMock } from './fields/RoundedButton';
import { ArrowLeftIcon, ChevronLeftIcon, CloseIcon } from './Icon';
import { Gap } from './Layout';
import ReactPortal from './ReactPortal';
import { H2, H3Label2Responsive, Label2 } from './Text';
import { IconButtonTransparentBackground } from './fields/IconButton';
import { AnimateHeightChange } from './shared/AnimateHeightChange';
import { IonContent, IonModal } from '@ionic/react';
import { cn, iosKeyboardTransition } from '../libs/css';
import { useKeyboardHeight } from '../hooks/keyboard/useKeyboardHeight';
import { atom, ReadonlyAtom } from '@tonkeeper/core/dist/entries/atom';
import { TargetEnv } from '@tonkeeper/core/dist/AppSdk';

const notificationMaxWidth = 650;

const NotificationContainer = styled(Container)<{ scrollbarWidth: number }>`
    background: transparent;
    padding-left: ${props => props.scrollbarWidth}px;
    transition: max-width 0.2s ease-in-out;

    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            min-height: 100%;
            height: 100%;
            max-width: ${notificationMaxWidth}px;
        `}
`;

const NotificationWrapper: FC<PropsWithChildren<{ entered: boolean; className?: string }>> = ({
    children,
    entered,
    className
}) => {
    const sdk = useAppSdk();

    const scrollbarWidth = useMemo(() => {
        return window.innerWidth > notificationMaxWidth ? sdk.getScrollbarWidth() : 0;
    }, [sdk, entered]);

    return (
        <NotificationContainer
            className={'notification-container' + className ? ' ' + className : ''}
            id=""
            scrollbarWidth={scrollbarWidth}
        >
            {children}
        </NotificationContainer>
    );
};

const Wrapper = styled.div<{ $moveToTop: boolean }>`
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: var(--app-height);

    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            justify-content: ${p.$moveToTop ? 'flex-start' : 'center'};
        `}
`;

export const ButtonContainer = styled.div`
    width: 100%;
    display: flex;
    justify-content: end;
`;

const Padding = styled.div`
    flex-shrink: 0;
    height: 1rem;
`;

const PaddingAdjusted = styled(Padding)`
    ${p =>
        p.theme.displayType !== 'full-width' &&
        css`
            display: none;
        `}
`;

const GapAdjusted = styled(Gap)`
    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            display: none;
        `}
`;

const Overlay = styled.div<{ entered: boolean; paddingRight: number; $appTargetEnv: TargetEnv }>`
    position: fixed;
    left: 0;
    right: 0;
    height: 100%;
    top: 100%;
    transition: top 0.3s ease-in-out;
    overflow-y: ${props =>
        props.entered ? (props.$appTargetEnv === 'extension' ? 'auto' : 'scroll') : 'hidden'};
    padding-right: ${props => props.paddingRight}px;
    -webkit-overflow-scrolling: touch;
`;

const OverlayWrapper = React.forwardRef<HTMLDivElement, PropsWithChildren<{ entered: boolean }>>(
    ({ entered, children }, ref) => {
        const sdk = useAppSdk();

        const scrollbarWidth = useMemo(() => {
            return sdk.getScrollbarWidth();
        }, [sdk, entered]);

        return (
            <Overlay
                ref={ref}
                entered={entered}
                paddingRight={entered ? 0 : scrollbarWidth}
                className="notification-overlay"
                $appTargetEnv={sdk.targetEnv}
            >
                {children}
            </Overlay>
        );
    }
);

const Splash = styled.div`
    position: fixed;
    inset: 0;
    background-color: ${p => p.theme.backgroundOverlayStrong};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
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
    &.enter-done ${Overlay} {
        top: 0;
        pointer-events: auto;
    }

    &.exit {
        opacity: 0;
    }
    &.exit ${Overlay} {
        top: 100%;
        overflow-y: hidden;
    }
`;

const Content = styled.div<{ standalone: boolean; $isInWidget: boolean }>`
    width: 100%;
    background-color: ${props => props.theme.backgroundPage};
    border-top-right-radius: ${props => props.theme.cornerMedium};
    border-top-left-radius: ${props => props.theme.cornerMedium};
    padding: 1rem;
    flex-shrink: 0;
    box-sizing: border-box;

    ${props =>
        props.standalone &&
        css`
            padding-bottom: 2rem;
        `}

    ${props =>
        props.$isInWidget &&
        css`
            padding-bottom: 46px;
        `}

    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            border-top-right-radius: ${props => props.theme.cornerSmall};
            border-top-left-radius: ${props => props.theme.cornerSmall};
            border-bottom-right-radius: ${p.theme.cornerSmall};
            border-bottom-left-radius: ${p.theme.cornerSmall};
            max-height: calc(100% - 32px);
            overflow: auto;
            padding-top: 0;
            padding-bottom: 0;
        `}
`;

const TitleRow = styled.div`
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    user-select: none;
    width: 100%;

    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            margin-bottom: 0;
        `}
`;

const FooterWrapper = styled.div<{ $keyboardShift?: number }>`
    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            padding-bottom: max(calc(env(safe-area-inset-bottom) - 16px), 0px);
            background-color: ${p.theme.backgroundPage};
            position: sticky;
            bottom: 0;
            z-index: 100;
            ${p.$keyboardShift
                ? css`
                      transform: translateY(
                          calc(${-p.$keyboardShift}px + env(safe-area-inset-bottom) - 16px)
                      );
                  `
                : css`
                      transform: translateY(0);
                  `}

            transition: transform ${iosKeyboardTransition};

            &:empty {
                padding-bottom: ${p.$keyboardShift
                    ? '0'
                    : 'max(env(safe-area-inset-bottom), 1rem)'};
            }
        `}
`;

const HeaderWrapper = styled.div`
    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            position: sticky;
            top: 0;
            z-index: 100;
            padding: 0 1rem;
            margin: 0 -1rem;
            background: ${p.theme.backgroundPage};

            &:empty {
                padding-bottom: 1rem;
            }
        `}

    > *:not(:last-child) {
        display: none;
    }
`;

const RowTitle = styled(H3Label2Responsive)`
    overflow: hidden;
    margin: 0;
    user-select: none;
    flex: 1;
`;

const RowTitleDesktop = styled(Label2)`
    overflow: hidden;
    margin: 0;
    user-select: none;
    flex: 1;
`;

const BackShadow = styled.div`
    width: var(--app-width);
    height: 60vh;
    position: absolute;
    z-index: -1;
    top: 80%;
    background-color: ${props => props.theme.backgroundPage};

    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            max-width: ${notificationMaxWidth}px;
        `}
`;

export const NotificationTitleRow: FC<
    PropsWithChildren<{
        handleClose?: () => void;
        center?: boolean;
        className?: string;
        onBack?: () => void;
    }>
> = ({ handleClose, children, center = false, className, onBack }) => {
    const isFullWidthMode = useIsFullWidthMode();
    return (
        <TitleRow className={className}>
            {onBack ? <NotificationBackButton onBack={onBack} /> : center && <ButtonMock />}
            {center && <ButtonMock />}
            {isFullWidthMode ? (
                <RowTitleDesktop>{children}</RowTitleDesktop>
            ) : (
                <RowTitle>{children}</RowTitle>
            )}
            {handleClose ? <NotificationCancelButton handleClose={handleClose} /> : <ButtonMock />}
        </TitleRow>
    );
};

export const NotificationTitle = styled(H2)`
    padding-right: 2rem;
    box-sizing: border-box;
`;

export const NotificationBlock = styled.form`
    display: flex;
    gap: 1rem;
    flex-direction: column;
    align-items: center;
`;

export const FullHeightBlock = styled(NotificationBlock)<{
    standalone: boolean;
    fitContent?: boolean;
    noPadding?: boolean;
}>`
    min-height: ${props =>
        props.fitContent ? 'unset' : `calc(var(--app-height) - ${props.standalone ? 3 : 2}rem)`};
    padding-bottom: ${props => (props.noPadding ? 0 : 'calc(56px + 1rem)')};
    box-sizing: border-box;

    background-color: ${props => props.theme.backgroundPage};

    ${props =>
        props.theme.displayType === 'full-width' &&
        css`
            min-height: unset;
            padding-top: 2px;
            padding-bottom: 1rem;
        `};
`;

export const FullHeightBlockResponsive = styled(FullHeightBlock)<{
    standalone: boolean;
    fitContent?: boolean;
    noPadding?: boolean;
}>`
    ${props =>
        props.theme.displayType === 'full-width' &&
        css`
            min-height: unset;
        `};
`;

export const NotificationTitleBlock = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    gap: 1rem;

    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            align-items: center;
        `}
`;

const DesktopCloseButtonStyled = styled(IconButtonTransparentBackground)`
    margin-right: -10px;
`;

const DesktopBackButtonStyled = styled(IconButtonTransparentBackground)`
    margin-left: -10px;
`;

export const NotificationCancelButton: FC<{ handleClose: () => void }> = ({ handleClose }) => {
    const isFullWidthMode = useIsFullWidthMode();

    if (isFullWidthMode) {
        return (
            <DesktopCloseButtonStyled onClick={handleClose}>
                <CloseIcon />
            </DesktopCloseButtonStyled>
        );
    }

    return (
        <RoundedButton onClick={handleClose}>
            <CloseIcon />
        </RoundedButton>
    );
};

export const NotificationBackButton: FC<{ onBack: () => void }> = ({ onBack }) => {
    const isFullWidthMode = useIsFullWidthMode();

    if (isFullWidthMode) {
        return (
            <DesktopBackButtonStyled onClick={onBack}>
                <ArrowLeftIcon />
            </DesktopBackButtonStyled>
        );
    }

    return (
        <RoundedButton onClick={onBack}>
            <ChevronLeftIcon />
        </RoundedButton>
    );
};

const NotificationOverlay: FC<PropsWithChildren<{ handleClose: () => void; entered: boolean }>> =
    React.memo(({ children, entered }) => {
        const scrollRef = useRef<HTMLDivElement>(null);

        return (
            <OverlayWrapper ref={scrollRef} entered={entered}>
                {children}
            </OverlayWrapper>
        );
    });
NotificationOverlay.displayName = 'NotificationOverlay';

const NotificationContentPortalRoot = styled.div`
    display: contents;
`;

export type OnCloseInterceptor =
    | ((closeHandle: () => void, cancelCloseHandle: () => void) => void)
    | undefined;

const notificationsControl = {
    untaggedCloseHandlers: new Set<() => void>(),
    taggedCloseHandlers: new Map<string, () => void>(),
    openedNotifications$: atom<{ id: string; tag?: string }[]>([])
};

export function closeAllNotifications() {
    notificationsControl.untaggedCloseHandlers.forEach(handler => handler());
    [...notificationsControl.taggedCloseHandlers.values()].forEach(handler => handler());
}

export function closeNotification(tag: string) {
    notificationsControl.taggedCloseHandlers.get(tag)?.();
}

export const openedNotifications$: ReadonlyAtom<{ id: string; tag?: string }[]> =
    notificationsControl.openedNotifications$;

const useConnectNotificationCloseControl = (
    tag: string | undefined,
    handleClose: () => void,
    isOpen: boolean
) => {
    const id = useRef(Date.now().toString());
    useEffect(() => {
        const list = notificationsControl.openedNotifications$.value;

        if (isOpen) {
            notificationsControl.openedNotifications$.next([
                ...list.filter(v => v.id !== id.current),
                { id: id.current, tag }
            ]);
        } else if (list.some(item => item.id === id.current)) {
            notificationsControl.openedNotifications$.next(list.filter(v => v.id !== id.current));
        }
    }, [tag, isOpen]);

    useEffect(() => {
        if (tag) {
            notificationsControl.taggedCloseHandlers.set(tag, handleClose);
            return () => {
                notificationsControl.taggedCloseHandlers.delete(tag);
            };
        }

        notificationsControl.untaggedCloseHandlers.add(handleClose);

        return () => {
            notificationsControl.untaggedCloseHandlers.delete(handleClose);
        };
    }, [tag, handleClose]);
};

export const Notification: FC<{
    isOpen: boolean;
    handleClose: () => void;
    hideButton?: boolean;
    backShadow?: boolean;
    title?: ReactNode;
    footer?: ReactNode;
    children: (afterClose: (action?: () => void) => void) => React.ReactNode;
    className?: string;
    disableHeightAnimation?: boolean;
    mobileFullScreen?: boolean;
    afterClose?: () => void;
    tag?: string;
}> = props => {
    const targetEnv = useAppTargetEnv();

    if (targetEnv === 'mobile') {
        return <NotificationIonic {...props} />;
    }

    return <NotificationDesktopAndWeb {...props} />;
};

export const NotificationIonic: FC<{
    isOpen: boolean;
    handleClose: () => void;
    hideButton?: boolean;
    title?: ReactNode;
    footer?: ReactNode;
    children: (afterClose: (action?: () => void) => void) => React.ReactNode;
    className?: string;
    disableHeightAnimation?: boolean;
    mobileFullScreen?: boolean;
    afterClose?: () => void;
    tag?: string;
}> = ({
    children,
    isOpen,
    hideButton,
    handleClose,
    title,
    footer,
    className,
    disableHeightAnimation,
    mobileFullScreen,
    afterClose,
    tag
}) => {
    const [onBack, setOnBack] = useState<(() => void) | undefined>();
    const [onCloseInterceptor, setOnCloseInterceptor] = useState<OnCloseInterceptor>();
    const onClose = useCallback(() => {
        if (!onCloseInterceptor) {
            handleClose();
        } else {
            onCloseInterceptor(handleClose, () => {});
        }
    }, [handleClose, onCloseInterceptor]);

    useConnectNotificationCloseControl(tag, handleClose, isOpen);

    /**
     * Prevent Ionic bug -- touching modal background calls canDismiss twice
     */
    const canDismissAnswerCache = useRef<{ timestamp: number; answer: boolean } | undefined>();

    const canDismiss = useMemo(() => {
        if (!onCloseInterceptor || !isOpen) {
            return true;
        } else {
            return () => {
                if (
                    canDismissAnswerCache.current &&
                    Date.now() - canDismissAnswerCache.current.timestamp <= 600
                ) {
                    return Promise.resolve(canDismissAnswerCache.current.answer);
                }

                return new Promise<boolean>(r =>
                    onCloseInterceptor(
                        () => {
                            canDismissAnswerCache.current = {
                                timestamp: Date.now(),
                                answer: true
                            };
                            r(true);
                        },
                        () => {
                            canDismissAnswerCache.current = {
                                timestamp: Date.now(),
                                answer: false
                            };
                            r(false);
                        }
                    )
                );
            };
        }
    }, [handleClose, onCloseInterceptor, isOpen]);

    useEffect(() => {
        if (!isOpen) {
            canDismissAnswerCache.current = undefined;
        }
    }, [isOpen]);

    const [footerElement, setFooterElement] = useState<HTMLDivElement | null>(null);
    const [headerElement, setHeaderElement] = useState<HTMLDivElement | null>(null);

    const Child = useMemo(() => {
        return children((_afterClose?: () => void) => {
            setTimeout(() => _afterClose && _afterClose(), 100);
            onClose();
        });
    }, [isOpen, children, onClose]);

    const HeightAnimation = useMemo(() => {
        if (disableHeightAnimation || mobileFullScreen) {
            return Fragment;
        }

        return AnimateHeightChange;
    }, [disableHeightAnimation, mobileFullScreen]);

    const keyboardHeight = useKeyboardHeight();

    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <NotificationContext.Provider
            value={{
                footerElement,
                headerElement,
                setOnBack,
                setOnCloseInterceptor
            }}
        >
            <IonModal
                isOpen={isOpen}
                onWillDismiss={handleClose}
                onDidDismiss={afterClose}
                canDismiss={canDismiss}
                initialBreakpoint={1}
                breakpoints={[0, 1]}
                handle={false}
                className={cn(className, mobileFullScreen && 'modal-mobile-fullscreen')}
            >
                <IonicModalContentStyled>
                    <HeightAnimation>
                        <HeaderWrapper ref={setHeaderElement} />

                        {/**
                         We use createPortal here and with Child as well due to React and Ionic events binding bug.
                         Otherwise, events binding will not work sometimes with react 18.2.0 and ionic 8.4.2
                         https://github.com/ionic-team/ionic-framework/issues/28819
                         */}
                        {(title || !hideButton) &&
                            !!headerElement &&
                            createPortal(
                                <NotificationHeader className="dialog-header">
                                    <NotificationTitleRow
                                        onBack={onBack}
                                        handleClose={hideButton ? undefined : onClose}
                                    >
                                        {title}
                                    </NotificationTitleRow>
                                </NotificationHeader>,
                                headerElement
                            )}

                        <NotificationContentPortalRoot ref={contentRef} />
                        {!!contentRef.current && createPortal(Child, contentRef.current)}

                        <Gap />
                        <FooterWrapper ref={setFooterElement} $keyboardShift={keyboardHeight}>
                            {footer}
                        </FooterWrapper>
                    </HeightAnimation>
                </IonicModalContentStyled>
            </IonModal>
        </NotificationContext.Provider>
    );
};

const IonicModalContentStyled = styled(IonContent)`
    display: contents;

    &::part(scroll) {
        border-top-right-radius: ${props => props.theme.cornerMedium};
        border-top-left-radius: ${props => props.theme.cornerMedium};
        padding: 0 1rem 0;
        position: relative;
        display: flex;
        flex-direction: column;
        min-height: 100%;

        overscroll-behavior-y: none;
    }

    &::part(background) {
        border-top-right-radius: ${props => props.theme.cornerMedium};
        border-top-left-radius: ${props => props.theme.cornerMedium};
    }

    * {
        box-sizing: border-box;
    }
`;

export const NotificationDesktopAndWeb: FC<{
    isOpen: boolean;
    handleClose: () => void;
    hideButton?: boolean;
    backShadow?: boolean;
    title?: ReactNode;
    footer?: ReactNode;
    children: (afterClose: (action?: () => void) => void) => React.ReactNode;
    className?: string;
    afterClose?: () => void;
    tag?: string;
}> = ({
    children,
    isOpen,
    hideButton,
    backShadow,
    handleClose,
    title,
    footer,
    className,
    afterClose,
    tag
}) => {
    const animationTime = 200;
    const [onCloseInterceptor, setOnCloseInterceptor] = useState<OnCloseInterceptor>();
    const onClose = useCallback(() => {
        if (!onCloseInterceptor) {
            handleClose();
            setTimeout(() => afterClose && afterClose(), animationTime);
        } else {
            onCloseInterceptor(
                () => {
                    handleClose();
                    setTimeout(() => afterClose && afterClose(), animationTime);
                },
                () => {}
            );
        }
    }, [handleClose, onCloseInterceptor, afterClose]);
    const [entered, setEntered] = useState(false);
    const [open, setOpen] = useState(false);
    const { displayType } = useTheme();

    useEffect(() => {
        setTimeout(() => setOpen(isOpen));
    }, [isOpen]);

    useConnectNotificationCloseControl(tag, handleClose, isOpen);

    const sdk = useAppSdk();
    const nodeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const closeOnEscapeKey = (e: KeyboardEvent) =>
            e.key === 'Escape' && open ? onClose() : null;
        document.body.addEventListener('keydown', closeOnEscapeKey);
        return () => {
            document.body.removeEventListener('keydown', closeOnEscapeKey);
        };
    }, [onClose, open]);

    const Child = useMemo(() => {
        return children((_afterClose?: () => void) => {
            setTimeout(() => _afterClose && _afterClose(), animationTime);
            onClose();
        });
    }, [open, children, onClose]);

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
        handler();
        const timer = setTimeout(handler, animationTime + 1);
        const timer2 = setTimeout(handler, animationTime + 100);

        return () => {
            clearTimeout(timer);
            clearTimeout(timer2);
            handler();
        };
    }, [open, entered, sdk]);

    const standalone = useMemo(() => {
        return sdk.isIOs() && sdk.isStandalone();
    }, [sdk]);

    const footerRef = useRef<HTMLDivElement | null>(null);
    const headerRef = useRef<HTMLDivElement | null>(null);
    const [footerElement, setFooterElement] = useState<HTMLDivElement | null>(null);
    const [headerElement, setHeaderElement] = useState<HTMLDivElement | null>(null);

    const [isEntering, setIsEntering] = useState(false);

    useEffect(() => {
        if (isEntering && footerRef.current) {
            setFooterElement(footerRef.current);
        } else {
            setFooterElement(null);
        }

        if (isEntering && headerRef.current) {
            setHeaderElement(headerRef.current);
        } else {
            setHeaderElement(null);
        }
    }, [isEntering]);

    const isFullWidth = useIsFullWidthMode();
    const onClickOutside = useCallback(() => {
        if (isFullWidth) {
            onClose();
        }
    }, [isFullWidth, onClose]);

    const handleCloseOnlyOnNotFullWidth = useCallback(() => {
        if (!isFullWidth) {
            onClose();
        }
    }, [isFullWidth, onClose]);

    const containerRef = useClickOutside<HTMLDivElement>(onClickOutside, nodeRef.current);
    const [onBack, setOnBack] = useState<(() => void) | undefined>();

    const isInWidget = useAppTargetEnv() === 'swap_widget_web';
    const isKeyboardOpen = useKeyboardHeight();

    return (
        <NotificationContext.Provider
            value={{
                footerElement,
                headerElement,
                setOnBack,
                setOnCloseInterceptor
            }}
        >
            <ReactPortal wrapperId="react-portal-modal-container">
                <CSSTransition
                    in={open}
                    timeout={animationTime}
                    unmountOnExit
                    nodeRef={nodeRef}
                    onEntering={() => setIsEntering(true)}
                    onExited={() => setIsEntering(false)}
                    onEntered={() => {
                        setTimeout(() => setEntered(true), animationTime);
                    }}
                    onExit={() => setEntered(false)}
                >
                    <Splash ref={nodeRef} className="scrollable">
                        <NotificationOverlay handleClose={onClose} entered={entered}>
                            <NotificationWrapper entered={entered} className={className}>
                                <Wrapper $moveToTop={!!isKeyboardOpen}>
                                    <Padding onClick={handleCloseOnlyOnNotFullWidth} />
                                    <GapAdjusted onClick={handleCloseOnlyOnNotFullWidth} />
                                    <Content
                                        $isInWidget={isInWidget}
                                        standalone={standalone}
                                        ref={containerRef}
                                        className="dialog-content"
                                    >
                                        <AnimateHeightChange>
                                            <HeaderWrapper ref={headerRef}>
                                                {(title || !hideButton) && (
                                                    <NotificationHeader
                                                        className="dialog-header"
                                                        noPaddingBottom={!title}
                                                    >
                                                        <NotificationTitleRow
                                                            onBack={onBack}
                                                            handleClose={
                                                                hideButton ? undefined : onClose
                                                            }
                                                        >
                                                            {title}
                                                        </NotificationTitleRow>
                                                    </NotificationHeader>
                                                )}
                                            </HeaderWrapper>
                                            {Child}
                                            <FooterWrapper ref={footerRef}>{footer}</FooterWrapper>
                                        </AnimateHeightChange>
                                    </Content>
                                    <PaddingAdjusted onClick={handleCloseOnlyOnNotFullWidth} />
                                </Wrapper>
                            </NotificationWrapper>
                        </NotificationOverlay>
                        {backShadow && entered && displayType !== 'full-width' && <BackShadow />}
                    </Splash>
                </CSSTransition>
            </ReactPortal>
        </NotificationContext.Provider>
    );
};
Notification.displayName = 'Notification';

const NotificationFooterStyled = styled.div`
    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            padding-bottom: 16px;

            & > * {
                position: relative;
                z-index: 102;
            }

            &::after {
                content: '';
                display: block;
                background-color: ${p.theme.backgroundPage};
                width: 100%;
                height: 20px;
                position: absolute;
                bottom: 0;
                z-index: 101;
            }
        `}
`;

export const NotificationHeaderStyled = styled.div<{ $noPaddingBottom?: boolean }>`
    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            background: ${p.theme.backgroundPage};
            padding-top: 8px;
            padding-bottom: 8px;
        `}

    ${p =>
        p.theme.proDisplayType === 'desktop' &&
        css`
            padding-top: 16px;
            padding-bottom: ${p.$noPaddingBottom ? '0' : '16px'};
        `}
`;

export const NotificationFooter = forwardRef<HTMLDivElement, { children: ReactNode }>(
    ({ children }, ref) => {
        const isFullWidth = useIsFullWidthMode();

        if (!isFullWidth) {
            return <>{children}</>;
        }

        return <NotificationFooterStyled ref={ref}>{children}</NotificationFooterStyled>;
    }
);

export const NotificationHeader = forwardRef<
    HTMLDivElement,
    { children: ReactNode; className?: string; noPaddingBottom?: boolean }
>(({ children, className, noPaddingBottom }, ref) => {
    const isFullWidth = useIsFullWidthMode();

    if (!isFullWidth) {
        return (
            <>
                {Children.map(children, child =>
                    React.isValidElement(child)
                        ? React.cloneElement<{ className?: string }>(
                              child as ReactElement<{ className?: string }>,
                              {
                                  className: `${child.props.className || ''} ${className}`.trim()
                              }
                          )
                        : child
                )}
            </>
        );
    }

    return (
        <NotificationHeaderStyled
            ref={ref}
            className={className}
            $noPaddingBottom={noPaddingBottom}
        >
            {children}
        </NotificationHeaderStyled>
    );
});

export const NotificationContext = createContext<{
    footerElement: Element | null;
    headerElement: Element | null;
    setOnBack: (callback: (() => void) | undefined) => void;
    setOnCloseInterceptor: (interceptor: OnCloseInterceptor) => void;
}>({
    footerElement: null,
    headerElement: null,
    setOnBack: () => {},
    setOnCloseInterceptor: () => {}
});

export const NotificationFooterPortal: FC<{ children: ReactNode }> = ({ children }) => {
    const { footerElement } = useContext(NotificationContext);
    const isFullWidth = useIsFullWidthMode();

    if (footerElement && isFullWidth) {
        return createPortal(children, footerElement);
    }

    return <>{children}</>;
};

export const NotificationHeaderPortal: FC<{ children: ReactNode }> = ({ children }) => {
    const { headerElement } = useContext(NotificationContext);
    const isFullWidth = useIsFullWidthMode();

    if (headerElement && isFullWidth) {
        return createPortal(children, headerElement);
    }

    return <>{children}</>;
};

export const useSetNotificationOnBack = (onBack: undefined | (() => void)) => {
    const { setOnBack } = useContext(NotificationContext);

    useEffect(() => {
        setOnBack(() => onBack);
    }, [setOnBack, onBack]);

    useEffect(() => {
        return () => setOnBack(undefined);
    }, []);
};

export const useSetNotificationOnCloseInterceptor = (interceptor: OnCloseInterceptor) => {
    const { setOnCloseInterceptor } = useContext(NotificationContext);

    useEffect(() => {
        setOnCloseInterceptor(() => interceptor);
    }, [setOnCloseInterceptor, interceptor]);

    useEffect(() => {
        return () => setOnCloseInterceptor(undefined);
    }, []);
};
