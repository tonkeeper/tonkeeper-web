import styled, { createGlobalStyle, css } from 'styled-components';

export const GlobalStyleCss = css`
    body {
        margin: 0;

        /* The literal stack after the var is the fallback for a shell that
           mounts styled-components without the Tailwind entry that declares
           --tk-font-sans. */
        font-family: var(
            --tk-font-sans,
            'TT Firs Neue',
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Roboto,
            'Helvetica Neue',
            'Noto Sans',
            Arial,
            sans-serif
        );

        /* Declared on :root in tailwind.css; read through the var so the
           vi-locale reset applies, with the literal set as the fallback for a
           shell that mounts styled-components without the Tailwind entry. */
        font-feature-settings: var(--tk-font-features, 'ss07' 1, 'ss09' 1, 'ss17' 1, 'ss18' 1);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: ${props => props.theme.backgroundContent};
        color: ${props => props.theme.textPrimary};
        overflow-y: scroll;
    }

    :root {
        --app-height: 100vh;
        --app-width: 100vw;
    }

    html.is-locked {
        height: calc(var(--app-height) - 1px);
    }

    html.is-locked,
    html.is-locked body,
    html.is-locked #root {
        /* want to block all overflowing content */
        overflow: hidden;

        /* want to exclude padding from the height */
        box-sizing: border-box;
    }

    /* Scroll-lock marker set by useWindowsScroll. Must not be named "hidden" —
       Tailwind's .hidden utility ships in the same bundle and would turn the
       whole document into display: none. */
    html.scroll-hidden,
    html.scroll-hidden body,
    html.scroll-hidden #root {
        overflow: hidden;
        -webkit-overflow-scrolling: touch;
    }

    html.no-user-select {
        * {
            user-select: none;
        }
    }

    .disable-hover {
        pointer-events: none;
    }

    input::-webkit-strong-password-auto-fill-button {
        display: none !important;
    }

    input::-webkit-contacts-auto-fill-button,
    input::-webkit-credentials-auto-fill-button {
        visibility: hidden;
        position: absolute;
        right: 0;
    }

    /*
     * Hide native scrollbars on every scroll surface — page body, the
     * mobile-app body id, the desktop content wrappers, and the notification
     * modal's overlay + inner dialog. Was previously gated to .win32/.linux
     * because macOS Electron used to inherit nice overlay scrollbars from the
     * OS; in practice (macOS "Always show scrollbars" + Chrome / Firefox
     * across all OSes) it leaves a chunky persistent bar that doesn't match
     * the dark theme. Consistency across platforms wins.
     *
     * Include html: body overflow propagates to the viewport, but its
     * scrollbar-width does not. Otherwise loading reserves a 15px root
     * scrollbar until the desktop shell sets overflow: hidden, shifting
     * centered content by half that width.
     */
    html,
    body,
    #body,
    .full-size-wrapper,
    .notification-overlay,
    .dialog-content,
    .hide-scrollbar {
        scrollbar-width: none; /* Firefox / non-WebKit */
    }

    html::-webkit-scrollbar,
    body::-webkit-scrollbar,
    #body::-webkit-scrollbar,
    .full-size-wrapper::-webkit-scrollbar,
    .notification-overlay::-webkit-scrollbar,
    .dialog-content::-webkit-scrollbar,
    .hide-scrollbar::-webkit-scrollbar {
        width: 0;
        height: 0;
    }

    /*
     * Everywhere else: no vertical bar, and a thin themed one for horizontal
     * overflow, which a mouse wheel can't reveal on its own. Deliberately
     * WebKit-only — setting scrollbar-width / scrollbar-color makes Chromium
     * ignore these pseudo-elements, and the standard properties can't style
     * the two axes separately. Firefox gets no bars at all instead.
     */
    *::-webkit-scrollbar {
        width: 0;
        height: 6px;
        background: transparent;
    }

    *::-webkit-scrollbar-thumb {
        border-radius: 3px;
        background-color: var(--tk-icon-tertiary);
    }

    *::-webkit-scrollbar-corner {
        background: transparent;
    }

    @supports not selector(::-webkit-scrollbar) {
        * {
            scrollbar-width: none;
        }
    }

    .pointer-events-none {
        pointer-events: none;
    }
`;

export const GlobalStyle = createGlobalStyle`
  ${GlobalStyleCss}
`;

export const Container = styled.div`
    min-width: 300px;
    max-width: 550px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    min-height: var(--app-height);
    background-color: ${props => props.theme.backgroundPage};
    white-space: pre-wrap;
`;

export const Body = styled.div`
    flex-grow: 1;
    padding: 0 1rem;
`;
