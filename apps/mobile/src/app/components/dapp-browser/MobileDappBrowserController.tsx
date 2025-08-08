import { useEffect, useId, useState } from 'react';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import {
    useActiveBrowserTab,
    useChangeBrowserTab,
    useCloseActiveBrowserTab,
    useOpenBrowserTab
} from '@tonkeeper/uikit/dist/state/dapp-browser';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';
import { MobileDappBrowserTab } from './MobileDappBrowserTab';
import { MobileDappBrowserNewTab } from './MobileDappBrowserNewTab';
import { useMenuController } from '@tonkeeper/uikit/dist/hooks/ionic';
import { CapacitorDappBrowser } from '../../../libs/plugins/dapp-browser-plugin';
import { NATIVE_BRIDGE_METHODS } from '../../../inject-scripts/native-bridge-methods';
import { z } from 'zod';

const Wrapper = styled(motion.div)`
    position: fixed;
    padding-bottom: calc(var(--footer-full-height) + 1px);
    inset: 0;

    &.dapp-browser-wrapper-exit {
        background: ${p => p.theme.backgroundPage};
    }

    &::after {
        position: absolute;
        background: ${p => p.theme.backgroundPage};
        bottom: 0;
        height: calc(var(--footer-full-height) + 1px);
        left: 0;
        right: 0;
        content: '';
    }
`;

/**
 * bridge plugin tab state change events to app state
 */
const useRegisterTabChangeListener = () => {
    const { mutate } = useChangeBrowserTab();
    const sdk = useAppSdk();

    useEffect(() => {
        return sdk.dappBrowser?.tabChange.subscribe(mutate);
    }, [sdk.dappBrowser]);
};

/**
 * focus app on sidebar menu open
 */
const useRegisterViewFocusListener = () => {
    const { isOpen: isAsideOpen } = useMenuController('aside-nav');
    const { isOpen: isWalletMenuOpen } = useMenuController('wallet-nav');

    useEffect(() => {
        CapacitorDappBrowser.setIsMainViewInFocus('wallet-nav', isWalletMenuOpen);
    }, [isWalletMenuOpen]);

    useEffect(() => {
        CapacitorDappBrowser.setIsMainViewInFocus('aside-nav', isAsideOpen);
    }, [isAsideOpen]);
};

const tgResponseSchema = z.object({
    base64Result: z.string()
});
const useProvideWindowApi = () => {
    const { mutate: openTab } = useOpenBrowserTab();
    const { mutate: closeTab } = useCloseActiveBrowserTab();
    const allowedHosts = ['oauth.telegram.org'];
    const allowedResponseOrigins = ['https://wallet.tonkeeper.com'];

    useEffect(() => {
        (window as unknown as { openDappBrowser: (url: string) => void }).openDappBrowser = (
            url: string
        ) => {
            const u = new URL(url);
            if (!allowedHosts.includes(u.host)) {
                throw new Error('Unsafe host');
            }

            openTab({ url });
        };

        CapacitorDappBrowser.setRequestsHandler(
            NATIVE_BRIDGE_METHODS.TG_AUTH.SEND_RESULT,
            async (rpcParams: Record<string, unknown>, { webViewOrigin }) => {
                if (!allowedResponseOrigins.includes(webViewOrigin)) {
                    throw new Error('Unsafe origin');
                }

                const { base64Result } = tgResponseSchema.parse(rpcParams);
                const detail = JSON.parse(Buffer.from(base64Result, 'base64').toString('utf8'));

                const customEvent = new CustomEvent('telegram-auth-success', {
                    detail: detail
                });

                window.dispatchEvent(customEvent);
                closeTab();
            }
        );
    }, []);
};

export const MobileDappBrowserController = () => {
    useRegisterTabChangeListener();
    useRegisterViewFocusListener();
    useProvideWindowApi();

    const tab = useActiveBrowserTab();
    const shouldDisplayBrowser = !!tab;

    const [backgroundIsReady, setBackgroundIsReady] = useState(false);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        if (shouldDisplayBrowser) {
            timeout = setTimeout(() => {
                document.body.classList.add('dapp-browser-open');
                setBackgroundIsReady(true);
            }, 170);
        }

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
            document.body.classList.remove('dapp-browser-open');
            setBackgroundIsReady(false);
        };
    }, [shouldDisplayBrowser]);

    const id = useId();
    const exitY = 200;

    return (
        <AnimatePresence mode="wait">
            {shouldDisplayBrowser && (
                <Wrapper
                    id={id}
                    key="dapp-browser"
                    initial={{ y: exitY, opacity: 0, pointerEvents: 'none' }}
                    animate={{ y: 0, opacity: 1, pointerEvents: 'unset' }}
                    exit={{ y: exitY, opacity: 0, pointerEvents: 'none' }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    onAnimationStart={definition => {
                        if ((definition as { y: number }).y === exitY) {
                            document.getElementById(id)?.classList.add('dapp-browser-wrapper-exit');
                        } else {
                            document
                                .getElementById(id)
                                ?.classList.remove('dapp-browser-wrapper-exit');
                        }
                    }}
                >
                    {tab === 'blanc' ? (
                        <MobileDappBrowserNewTab />
                    ) : (
                        <MobileDappBrowserTab tab={tab} isAnimating={!backgroundIsReady} />
                    )}
                </Wrapper>
            )}
        </AnimatePresence>
    );
};
