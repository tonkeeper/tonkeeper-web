import { FC, useEffect, useRef, useState } from 'react';
import {
    BrowserTab,
    useAddBrowserTabToState,
    useCloseActiveBrowserTab,
    useHideActiveBrowserTab
} from '@tonkeeper/uikit/dist/state/dapp-browser';
import styled, { css } from 'styled-components';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { Body2 } from '@tonkeeper/uikit';
import { BrowserTabIdentifier } from '@tonkeeper/core/dist/service/dappBrowserService';
import { OptionalProperty } from '@tonkeeper/core/dist/utils/types';
import { IconButtonTransparentBackground } from '@tonkeeper/uikit/dist/components/fields/IconButton';
import { CloseIcon, MinusIcon } from '@tonkeeper/uikit/dist/components/Icon';
import { asideWalletSelected$, useActiveWallet } from '@tonkeeper/uikit/dist/state/wallet';
import { tonConnectInjectedConnector } from '../../../libs/ton-connect/injected-connector';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';

const Wrapper = styled.div`
    box-sizing: border-box;
    height: 100%;
    display: flex;
    flex-direction: column;

    > *:last-child {
        flex: 1;
    }
`;

const TabHeader = styled.div`
    padding: calc(8px + env(safe-area-inset-top)) 16px 8px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: ${p => p.theme.backgroundContent};
`;

const BackgroundStyled = styled.div<{ $isTransparent: boolean }>`
    background: ${p => p.theme.backgroundPage};
    flex-direction: column;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 100%;

    ${p =>
        p.$isTransparent &&
        css`
            background-color: transparent;
            opacity: 0;
        `};

    transition: opacity 0.1s ease-in-out, background-color 0.1s ease-in-out;

    img {
        width: 60px;
        height: 60px;
        border-radius: ${p => p.theme.corner2xSmall};
    }

    ${Body2} {
        color: ${p => p.theme.textSecondary};
    }
`;

export const MobileDappBrowserTab: FC<{
    tab: BrowserTab | BrowserTabIdentifier;
    isAnimating?: boolean;
}> = ({ tab, isAnimating }) => {
    const {
        title,
        iconUrl,
        url,
        id: tabId,
        isLive
    } = tab as OptionalProperty<BrowserTab, 'title' | 'iconUrl' | 'isLive'>;
    const { mutate: addTab } = useAddBrowserTabToState();
    const [tabIsReady, setTabIsReady] = useState(false);
    const [tabIsCreated, setTabIsCreated] = useState(false);
    const sdk = useAppSdk();

    useEffect(() => {
        sdk.dappBrowser?.open(url, tabId).then(t => {
            addTab(t);
            setTabIsCreated(true);
        });
    }, [tabId, url]);

    useEffect(() => {
        if (!tabIsCreated) {
            return;
        }

        if (isLive) {
            setTabIsReady(true);
        } else {
            setTimeout(() => {
                setTabIsReady(true);
            }, 800);
        }
    }, [isLive, tabIsCreated]);

    const { mutate: hideTab } = useHideActiveBrowserTab();
    const { mutate: closeTab } = useCloseActiveBrowserTab();

    const activeWallet = useActiveWallet();

    const tabRef = useRef(tab);
    useEffect(() => {
        tabRef.current = tab;
    }, [tab]);

    const asideLastSelectedWallet = useRef<WalletId | undefined>();
    useEffect(() => asideWalletSelected$.subscribe(w => (asideLastSelectedWallet.current = w)), []);

    useEffect(() => {
        if (activeWallet.id === asideLastSelectedWallet.current) {
            // TODO ask user if he wants to connect to new wallet
            tonConnectInjectedConnector.changeConnectedWalletToActive(tabRef.current);
        }
    }, [activeWallet.id]);

    return (
        <Wrapper>
            <TabHeader>
                <IconButtonTransparentBackground onClick={() => closeTab()}>
                    <CloseIcon />
                </IconButtonTransparentBackground>
                <IconButtonTransparentBackground onClick={() => hideTab()}>
                    <MinusIcon />
                </IconButtonTransparentBackground>
            </TabHeader>
            <BackgroundStyled $isTransparent={tabIsReady && !isAnimating}>
                {!isLive && (
                    <>
                        {iconUrl ? <img src={iconUrl} /> : 'FallbackIcon'}
                        {title && <Body2>{title}</Body2>}
                    </>
                )}
            </BackgroundStyled>
        </Wrapper>
    );
};
