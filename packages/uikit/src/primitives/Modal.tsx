import {
    FC,
    KeyboardEvent as ReactKeyboardEvent,
    PropsWithChildren,
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import { createPortal } from 'react-dom';

import { BackButton } from './BackButton';
import { CloseButton } from './CloseButton';
import ReactPortal from '../components/ReactPortal';
import { cn } from '../libs/css';
import { useIsFullWidthMode } from '../hooks/useIsFullWidthMode';

/**
 * Tailwind-first modal primitive (multichain redesign).
 *
 * Standalone — owns its portal, transition, backdrop, scroll lock, top
 * bar, footer slot, back/close interceptor context, and tag-keyed close
 * registry. Has no dependency on the legacy `Notification` primitive
 * (`NotificationDesktopAndWeb`, `NotificationWrapper`, Ionic `IonModal`).
 *
 * Consumers of the Modal use `useSetModalOnBack`,
 * `useSetModalOnCloseInterceptor`, `ModalFooterPortal`, `ModalFooter`
 * exports below.
 *
 * No Ionic / native sheet behaviour. The mobile-narrow Capacitor shell
 * (Ionic `IonApp`) is out of scope for this primitive — see CLAUDE.md
 * "Migration status".
 */

const ANIMATION_MS = 200;

export type OnCloseInterceptor =
    | ((closeHandle: () => void, cancelCloseHandle: () => void) => void)
    | undefined;

// ── Imperative close-by-tag API ─────────────────────────────────────

const modalsControl = {
    taggedCloseHandlers: new Map<string, () => void>()
};

/**
 * Close an open Modal by its `tag`. Used from non-React contexts
 * (deep-link handlers, side-channels). Returns silently if no Modal
 * with that tag is mounted.
 */
export const closeModal = (tag: string) => {
    modalsControl.taggedCloseHandlers.get(tag)?.();
};

// ── Modal context (new) ─────────────────────────────────────────────

interface ModalContextValue {
    setOnBack: (callback: (() => void) | undefined) => void;
    setOnCloseInterceptor: (interceptor: OnCloseInterceptor) => void;
    setTopBarTitle: (title: ReactNode) => void;
    footerElement: HTMLDivElement | null;
    headerElement: HTMLDivElement | null;
}

const ModalContext = createContext<ModalContextValue>({
    setOnBack: () => {},
    setOnCloseInterceptor: () => {},
    setTopBarTitle: () => {},
    footerElement: null,
    headerElement: null
});

// ── Props ──────────────────────────────────────────────────────────

export type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    /** Centered H2 rendered at the top of the modal body. */
    heading?: ReactNode;
    /** Centered Body1 subtitle directly below `heading`. */
    subheading?: ReactNode;
    /**
     * Optional title rendered between the back arrow and close button
     * in the top bar. Prefer the inline `heading` slot instead. A child
     * of the modal can set it via `useSetModalTopBarTitle` instead; if
     * both are present the prop wins.
     */
    topBarTitle?: ReactNode;
    /** Hide the top-right close (X) button. */
    hideCloseButton?: boolean;
    /**
     * Back-button handler shown as the top-left arrow. Use this when the
     * enclosing screen knows its own back target (e.g. a multi-step flow).
     * For content-driven back (a sub-step inside the body), a child of the
     * modal can call `useSetModalOnBack` instead; if both are present the
     * prop wins.
     */
    onBack?: () => void;
    /**
     * Custom top-left control (e.g. the Header/Info button from the design
     * library). Rendered only when no back handler is active — a back arrow
     * always wins the slot.
     */
    topBarLeft?: ReactNode;
    /**
     * Custom top-right control (for example an overflow menu). When present,
     * it replaces the default close button without changing the title's
     * centered layout.
     */
    topBarRight?: ReactNode;
    /**
     * Mobile-only height variant:
     *  - `'auto'` (default) — bottom sheet sized to content, capped at 90vh
     *  - `'half'`          — bottom sheet floor 50vh, cap 80vh
     *  - `'full'`          — full-screen, no rounded corners
     * On desktop this prop is ignored — see `variant`.
     */
    mobileHeight?: 'auto' | 'half' | 'full';
    /**
     * Desktop card geometry (520px wide, centered, 16px viewport insets):
     *  - `'alert'` (default) — compact card sized to its content. For
     *    confirmations and short notices with a centered heading.
     *  - `'content'` — fixed-height card: 624px, or the viewport minus insets
     *    when that is shorter, regardless of how much content there is. For
     *    lists and multi-step flows with a top-bar title.
     * Ignored on mobile — see `mobileHeight`.
     */
    variant?: 'alert' | 'content';
    /**
     * Reserved for parity with the legacy primitive. The new Modal
     * doesn't animate per-step height changes at all, so this prop is
     * a no-op today; keep passing it from existing call sites without
     * editing them.
     */
    disableHeightAnimation?: boolean;
    /**
     * Chrome-less variant for screens that own their entire inner layout
     * (header, scroll containers, footer) — the Modal supplies only the
     * portal, backdrop, transition, scroll lock, and Escape/backdrop-click
     * close. Desktop: the `'content'` card geometry. Mobile: a full-bleed
     * sheet. `heading`/`topBarTitle`/`onBack`/`mobileHeight`/`variant` and
     * the header/footer slots do not apply.
     */
    bare?: boolean;
    /** Fires after the close animation completes. */
    afterClose?: () => void;
    /** Tag for imperative close via `closeModal(tag)`. */
    tag?: string;
    /** Extra classes for the inner card container. */
    className?: string;
    children: ReactNode;
};

/**
 * Body scroll lock, shared by every mounted modal. Nested sheets overlap, and
 * they don't necessarily unmount in the order they mounted — each one saving
 * and restoring `body.style.overflow` on its own would let an inner sheet
 * restore the outer sheet's `hidden`, leaving the page permanently unscrollable.
 * One counter plus one saved value avoids that.
 */
let openModalCount = 0;
let overflowBeforeLock = '';

/**
 * Backdrops on screen right now, shared by every mounted modal. When one
 * modal hands off to another (asset picker → send flow), each animating
 * its own dark backdrop makes the combined darkness dip mid-crossfade —
 * the page behind appears to flash. An incoming modal therefore skips
 * the backdrop fade-in when one is already fully dark, and an outgoing
 * modal keeps its backdrop opaque when another is still on screen.
 */
let visibleBackdropCount = 0;

/**
 * Open modals in opening order, shared by every mounted modal. A modal that
 * opens while another is open is nested: it pins itself to the bottom edge of
 * the modal below it, matches its width, and never grows past its height — a
 * nested card shorter than its parent sits on the parent's bottom edge, a
 * taller one covers the parent completely. Entries track `isOpen`, not being
 * mounted: a modal animating out has already left the stack, so a modal that
 * opens as another closes (a hand-off) takes its place instead of nesting.
 */
interface OpenModalEntry {
    card: HTMLElement | null;
}

const openModals: OpenModalEntry[] = [];
const openModalsListeners = new Set<() => void>();
const notifyOpenModalsChanged = () => openModalsListeners.forEach(listener => listener());

const parentCardOf = (entry: OpenModalEntry) => {
    const index = openModals.indexOf(entry);
    return index > 0 ? openModals[index - 1].card : null;
};

const lockBodyScroll = () => {
    if (openModalCount === 0) {
        overflowBeforeLock = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
    }
    openModalCount += 1;
    return () => {
        openModalCount -= 1;
        if (openModalCount === 0) {
            document.body.style.overflow = overflowBeforeLock;
        }
    };
};

// ── Modal component ─────────────────────────────────────────────────

export const Modal: FC<ModalProps> = ({
    isOpen,
    onClose,
    heading,
    subheading,
    topBarTitle,
    hideCloseButton,
    onBack: onBackProp,
    topBarLeft,
    topBarRight,
    mobileHeight = 'auto',
    variant = 'alert',
    bare,
    afterClose,
    tag,
    className,
    children
}) => {
    const isFullWidth = useIsFullWidthMode();

    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    // Back handler can come from the `onBack` prop (parent-driven) or from a
    // child via `useSetModalOnBack` (content-driven); the prop takes priority.
    const [onBackFromContext, setOnBack] = useState<(() => void) | undefined>();
    const onBack = onBackProp ?? onBackFromContext;
    // Top-bar title can come from the `topBarTitle` prop (parent-driven) or
    // from a child via `useSetModalTopBarTitle`; the prop takes priority.
    const [topBarTitleFromContext, setTopBarTitle] = useState<ReactNode>();
    const resolvedTopBarTitle = topBarTitle ?? topBarTitleFromContext;
    const hasTopBar = !!(
        onBack ||
        topBarLeft ||
        topBarRight ||
        !hideCloseButton ||
        resolvedTopBarTitle
    );
    const floatingCloseButton =
        !hideCloseButton && !onBack && !topBarLeft && !topBarRight && !resolvedTopBarTitle;
    const [onCloseInterceptor, setOnCloseInterceptor] = useState<OnCloseInterceptor>();
    const [footerElement, setFooterElement] = useState<HTMLDivElement | null>(null);
    const [headerElement, setHeaderElement] = useState<HTMLDivElement | null>(null);
    const [footerHeight, setFooterHeight] = useState(0);
    // `instantBackdrop` — another backdrop was already dark when this modal
    // mounted, so the backdrop appears at full opacity with no fade-in (the
    // card still animates). `keepBackdropOnClose` — another backdrop is still
    // on screen while this modal closes, so the backdrop stays opaque instead
    // of fading out from under it.
    const [instantBackdrop, setInstantBackdrop] = useState(false);
    const [keepBackdropOnClose, setKeepBackdropOnClose] = useState(false);
    const [cardElement, setCardElement] = useState<HTMLDivElement | null>(null);
    // The open modal directly below this one, if any, and its on-screen box.
    // The ref mirrors the state for effects that must read it without
    // re-running when it changes; it is deliberately not cleared on close so
    // the exit animation keeps the nested geometry.
    const [parentCard, setParentCard] = useState<HTMLElement | null>(null);
    const parentCardRef = useRef<HTMLElement | null>(null);
    const [parentRect, setParentRect] = useState<DOMRect | null>(null);
    const entryRef = useRef<OpenModalEntry | null>(null);

    const useMobileSheet = !isFullWidth;
    const isMobileFull = useMobileSheet && (mobileHeight === 'full' || bare);
    const hasBackdrop = !isMobileFull;
    const isContentSized = bare || variant === 'content';
    const isNested = parentRect !== null;

    // Stack membership follows `isOpen` so a closing modal stops being anyone's
    // parent immediately (see `openModals`).
    useLayoutEffect(() => {
        if (!isOpen) return undefined;
        const entry: OpenModalEntry = { card: null };
        entryRef.current = entry;
        openModals.push(entry);
        const update = () => {
            const parent = parentCardOf(entry);
            parentCardRef.current = parent;
            setParentCard(parent);
        };
        openModalsListeners.add(update);
        update();
        notifyOpenModalsChanged();
        return () => {
            openModalsListeners.delete(update);
            openModals.splice(openModals.indexOf(entry), 1);
            entryRef.current = null;
            notifyOpenModalsChanged();
        };
    }, [isOpen]);

    // The card mounts a render after `isOpen`, so publish it separately.
    useLayoutEffect(() => {
        if (!entryRef.current) return;
        entryRef.current.card = cardElement;
        notifyOpenModalsChanged();
    }, [cardElement]);

    useLayoutEffect(() => {
        if (!parentCard) {
            setParentRect(null);
            return undefined;
        }
        const measure = () => setParentRect(parentCard.getBoundingClientRect());
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(parentCard);
        window.addEventListener('resize', measure);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [parentCard]);

    // Mount + visibility animation. `visible` toggles the opacity
    // class one frame after mount so the entrance transition runs;
    // unmount is delayed by ANIMATION_MS so the exit transition can
    // complete before the portal tears down.
    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            const raf = requestAnimationFrame(() => setVisible(true));
            return () => cancelAnimationFrame(raf);
        }
        if (mounted) {
            setVisible(false);
            // Self is still counted here, so "> 1" means another backdrop
            // remains and this one must not fade out from under it — unless
            // that backdrop belongs to the parent this modal is nested over,
            // which must be un-dimmed as the nested modal leaves.
            setKeepBackdropOnClose(
                hasBackdrop && visibleBackdropCount > 1 && !parentCardRef.current
            );
            const t = setTimeout(() => {
                setMounted(false);
                afterClose?.();
            }, ANIMATION_MS);
            return () => clearTimeout(t);
        }
        return undefined;
    }, [isOpen, mounted, afterClose, hasBackdrop]);

    // Backdrop bookkeeping. Layout effect so the "skip the fade-in" decision
    // lands before first paint — the incoming backdrop must never show an
    // opacity-0 frame over an already-dark screen. A dark backdrop with no
    // open modal below is a hand-off; a nested modal fades in normally so
    // its parent visibly dims underneath it.
    useLayoutEffect(() => {
        if (!mounted || !hasBackdrop) return undefined;
        setInstantBackdrop(visibleBackdropCount > 0 && !parentCardRef.current);
        setKeepBackdropOnClose(false);
        visibleBackdropCount += 1;
        return () => {
            visibleBackdropCount -= 1;
        };
    }, [mounted, hasBackdrop]);

    // Once the entrance has painted, restore the transition class (a no-op
    // visually — opacity is already 1) so a later solo close still fades out.
    useEffect(() => {
        if (visible && instantBackdrop) {
            setInstantBackdrop(false);
        }
    }, [visible, instantBackdrop]);

    const requestClose = useCallback(() => {
        if (onCloseInterceptor) {
            onCloseInterceptor(onClose, () => {});
        } else {
            onClose();
        }
    }, [onClose, onCloseInterceptor]);

    // Scroll lock while open.
    useEffect(() => {
        if (!mounted) return undefined;
        return lockBodyScroll();
    }, [mounted]);

    // Escape closes the modal (routed through any interceptor). Fires only
    // when focus is outside the card (e.g. on <body>) — keydowns inside the
    // card are handled by `onCardKeyDown` and never bubble this far. Every
    // open modal listens, so only the topmost one acts; otherwise one press
    // would dismiss a nested modal together with its parent.
    useEffect(() => {
        if (!mounted) return undefined;
        const handler = (e: globalThis.KeyboardEvent) => {
            const isTopmost = openModals[openModals.length - 1] === entryRef.current;
            if (e.key === 'Escape' && isTopmost) requestClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [mounted, requestClose]);

    // Register the tag-keyed close handler. `closeModal(tag)` reaches
    // straight into `onClose` without going through the interceptor —
    // matches the legacy `closeNotification` semantics that side-channel
    // callers (deep links, etc.) rely on.
    useEffect(() => {
        if (!tag || !mounted) return undefined;
        modalsControl.taggedCloseHandlers.set(tag, onClose);
        return () => {
            modalsControl.taggedCloseHandlers.delete(tag);
        };
    }, [tag, onClose, mounted]);

    const onBackdropClick = useCallback(() => {
        // The handler sits on the backdrop element itself, a sibling of
        // the card, so card clicks never reach it. Closing on backdrop
        // click is desktop-only; mobile sheets keep their backdrop inert.
        if (isFullWidth) requestClose();
    }, [isFullWidth, requestClose]);

    const onCardKeyDown = useCallback(
        (e: ReactKeyboardEvent) => {
            // Close on Escape here rather than relying on the document
            // listener: stopping propagation halts the native event at the
            // portal container (React 17+ delegation), so keydowns from
            // focused content inside the card never reach `document`.
            // Content that wants Escape for itself (e.g. to dismiss a
            // dropdown) can stopPropagation before the event reaches the
            // card. Keydowns are still contained so they don't trigger
            // shortcuts outside the modal.
            if (e.key === 'Escape') requestClose();
            e.stopPropagation();
        },
        [requestClose]
    );

    // The action bar floats over the scroll body's bottom edge, so the body
    // is padded by the bar's measured height — the last row can scroll clear
    // of it, and a non-scrolling sheet keeps its content above the bar.
    useLayoutEffect(() => {
        if (!footerElement) {
            setFooterHeight(0);
            return;
        }
        const measure = () => setFooterHeight(footerElement.getBoundingClientRect().height);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(footerElement);
        return () => observer.disconnect();
    }, [footerElement]);

    const ctxValue = useMemo<ModalContextValue>(
        () => ({
            setOnBack,
            setOnCloseInterceptor,
            setTopBarTitle,
            footerElement,
            headerElement
        }),
        [footerElement, headerElement]
    );

    if (!mounted) return null;

    const nestedStyle = parentRect
        ? {
              left: parentRect.left,
              width: parentRect.width,
              bottom: window.innerHeight - parentRect.bottom,
              maxHeight: parentRect.height
          }
        : undefined;

    return (
        <ReactPortal wrapperId="react-portal-modal-container">
            <ModalContext.Provider value={ctxValue}>
                <div
                    role="presentation"
                    className={cn(
                        'fixed inset-0 z-50 flex',
                        isFullWidth
                            ? 'items-center justify-center p-4'
                            : isMobileFull
                            ? 'items-stretch justify-stretch'
                            : 'items-end justify-stretch'
                    )}
                >
                    {hasBackdrop && (
                        <div
                            aria-hidden
                            onClick={onBackdropClick}
                            className={cn(
                                'absolute inset-0 bg-backgroundOverlayStrong',
                                !instantBackdrop && 'transition-opacity duration-200',
                                visible || instantBackdrop || keepBackdropOnClose
                                    ? 'opacity-100'
                                    : 'opacity-0'
                            )}
                        />
                    )}
                    <div
                        ref={setCardElement}
                        role="dialog"
                        aria-modal="true"
                        onClick={e => e.stopPropagation()}
                        onKeyDown={onCardKeyDown}
                        style={nestedStyle}
                        className={cn(
                            'flex flex-col bg-backgroundPage',
                            isNested ? 'absolute' : 'relative',
                            'transition-opacity duration-200',
                            visible ? 'opacity-100' : 'opacity-0',
                            !bare && 'shadow-2xl',
                            isFullWidth
                                ? cn(
                                      // Height never exceeds viewport-minus-insets so the
                                      // body's `overflow-y-auto` engages instead of the card
                                      // running off screen with no way to reach the bottom.
                                      'w-full max-w-[520px] overflow-hidden rounded-large',
                                      isContentSized
                                          ? 'h-[min(624px,calc(var(--app-height)-32px))]'
                                          : 'max-h-[calc(var(--app-height)-32px)]'
                                  )
                                : isMobileFull
                                ? 'h-full w-full'
                                : mobileHeight === 'half'
                                ? 'min-h-[50vh] max-h-[80vh] w-full rounded-t-large'
                                : 'max-h-[90vh] w-full rounded-t-large',
                            className
                        )}
                    >
                        {bare ? (
                            children
                        ) : (
                            <>
                                {floatingCloseButton ? (
                                    // With nothing else in the top bar the close button floats
                                    // over the scroll body, so content scrolls beneath it
                                    // instead of being clipped by an opaque bar.
                                    <span className="absolute right-2 top-2 z-10 flex h-12 w-12 items-center justify-center">
                                        <CloseButton onClick={requestClose} />
                                    </span>
                                ) : (
                                    hasTopBar && (
                                        <div className="flex shrink-0 items-start justify-between gap-4 p-2">
                                            {onBack ? (
                                                <span className="flex h-12 w-12 shrink-0 items-center justify-center">
                                                    <BackButton onClick={onBack} />
                                                </span>
                                            ) : topBarLeft ? (
                                                // The slot keeps the close button's width so the
                                                // title stays centered; a wider control (a text
                                                // button) overflows it to the right.
                                                <span className="flex h-12 w-12 shrink-0 items-center justify-start">
                                                    {topBarLeft}
                                                </span>
                                            ) : (
                                                <span className="h-12 w-12 shrink-0" />
                                            )}
                                            {resolvedTopBarTitle ? (
                                                <span className="min-w-0 flex-1 break-words py-2.5 text-center text-h3 text-textPrimary">
                                                    {resolvedTopBarTitle}
                                                </span>
                                            ) : (
                                                <span />
                                            )}
                                            {topBarRight ? (
                                                <span className="flex h-12 w-12 shrink-0 items-center justify-center">
                                                    {topBarRight}
                                                </span>
                                            ) : !hideCloseButton ? (
                                                <span className="flex h-12 w-12 shrink-0 items-center justify-center">
                                                    <CloseButton onClick={requestClose} />
                                                </span>
                                            ) : (
                                                <span className="h-12 w-12 shrink-0" />
                                            )}
                                        </div>
                                    )
                                )}

                                <div
                                    ref={setHeaderElement}
                                    className="empty:hidden"
                                    aria-hidden={!headerElement}
                                />

                                {/* `[&>*]:shrink-0` — children must keep their natural height so
                                    overflowing content scrolls; otherwise flexbox compresses any
                                    child whose `overflow` isn't `visible` (its auto min-height is
                                    0) and its content gets clipped instead of scrolled. */}
                                <div
                                    // Inline padding replaces the class-level `pb-4`, so the
                                    // body's own bottom inset is re-added on top of the bar height.
                                    style={
                                        footerHeight
                                            ? { paddingBottom: `calc(1rem + ${footerHeight}px)` }
                                            : undefined
                                    }
                                    className={cn(
                                        'flex flex-1 flex-col overflow-y-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0',
                                        // Reserves the same height the top bar would have taken
                                        // so the heading clears the floating close button.
                                        floatingCloseButton && 'pt-16'
                                    )}
                                >
                                    {(heading || subheading) && (
                                        <div className="mb-6 flex flex-col items-center gap-1 text-center">
                                            {heading && (
                                                <h2 className="text-h2 text-textPrimary">
                                                    {heading}
                                                </h2>
                                            )}
                                            {subheading && (
                                                <p className="text-body1 text-textSecondary">
                                                    {subheading}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {children}
                                </div>

                                <div
                                    ref={setFooterElement}
                                    className="absolute inset-x-0 bottom-0 z-10 empty:hidden"
                                />
                            </>
                        )}
                    </div>
                </div>
            </ModalContext.Provider>
        </ReactPortal>
    );
};

// ── Public hooks ───────────────────────────────────────────────────

/**
 * Register a back-button handler in the enclosing `Modal`. When set,
 * the modal shows a back arrow in the top-left that calls the handler.
 * Pass `undefined` to hide the back arrow.
 */
export const useSetModalOnBack = (onBack: undefined | (() => void)) => {
    const { setOnBack } = useContext(ModalContext);
    useEffect(() => {
        setOnBack(() => onBack);
        return () => setOnBack(undefined);
    }, [setOnBack, onBack]);
};

/**
 * Register an interceptor that runs when the user tries to close the
 * modal (X button, ESC, backdrop). Used for the discard-confirm flow:
 * the interceptor can show a confirmation and decide whether to call
 * `closeHandle()` or `cancelClose()`.
 *
 * The tag-based `closeModal(tag)` API bypasses the interceptor — it's
 * meant for side-channel callers that have already made the close
 * decision elsewhere.
 */
export const useSetModalOnCloseInterceptor = (interceptor: OnCloseInterceptor) => {
    const { setOnCloseInterceptor } = useContext(ModalContext);
    useEffect(() => {
        setOnCloseInterceptor(() => interceptor);
        return () => setOnCloseInterceptor(undefined);
    }, [setOnCloseInterceptor, interceptor]);
};

/**
 * Set the enclosing `Modal`'s top-bar title (rendered between the back
 * arrow and the close button) from modal content. Used by multi-step
 * flows where each step owns its own title. The Modal's `topBarTitle`
 * prop wins if both are present.
 */
export const useSetModalTopBarTitle = (title: ReactNode) => {
    const { setTopBarTitle } = useContext(ModalContext);
    useEffect(() => {
        setTopBarTitle(title);
        return () => setTopBarTitle(undefined);
    }, [setTopBarTitle, title]);
};

// ── Footer portal ──────────────────────────────────────────────────

/**
 * Wraps a button (or button row) at the bottom of the modal sheet —
 * portaled into the Modal's footer slot. Outside a Modal it renders
 * its children inline; that fallback keeps screens reusable on routes
 * that aren't backed by a Modal yet.
 */
export const ModalFooterPortal: FC<PropsWithChildren> = ({ children }) => {
    const { footerElement } = useContext(ModalContext);
    if (footerElement) return createPortal(children, footerElement);
    return <>{children}</>;
};

/**
 * The action bar: the CTA(s) pinned over the bottom of the scroll body.
 * Its backdrop is the page background eased out to transparent towards the
 * top, so rows scrolling underneath dissolve into the bar rather than
 * meeting a hard edge.
 */
export const ModalFooter: FC<PropsWithChildren<{ className?: string }>> = ({
    children,
    className
}) => (
    <div
        className={cn(
            'relative flex w-full flex-col gap-2 px-4 pb-4',
            'before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-backgroundPage before:[mask-image:linear-gradient(to_top,#000_0%,#000000eb_20%,#000000ab_40%,#00000054_60%,#00000014_80%,transparent_100%)]',
            className
        )}
    >
        {children}
    </div>
);
