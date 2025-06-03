import { useEffect, useState } from 'react';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useActiveBrowserTab, useChangeBrowserTab } from '@tonkeeper/uikit/dist/state/dapp-browser';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';
import { MobileDappBrowserTab } from './MobileDappBrowserTab';
import { MobileDappBrowserNewTab } from './MobileDappBrowserNewTab';

const Wrapper = styled(motion.div)`
    position: fixed;
    padding-bottom: calc(var(--footer-full-height) + 1px);
    inset: 0;

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

export const MobileDappBrowserController = () => {
    const { mutate } = useChangeBrowserTab();
    const sdk = useAppSdk();

    useEffect(() => {
        return sdk.dappBrowser?.tabChange.subscribe(mutate);
    }, [sdk.dappBrowser]);

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

    return (
        <AnimatePresence mode="wait">
            {shouldDisplayBrowser && (
                <Wrapper
                    key="dapp-browser"
                    initial={{ y: 200, opacity: 0, pointerEvents: 'none' }}
                    animate={{ y: 0, opacity: 1, pointerEvents: 'unset' }}
                    exit={{ y: 200, opacity: 0, pointerEvents: 'none' }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
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
