import { FC, useCallback, useEffect, useRef, useState } from 'react';
import {
    BrowserTab,
    useAddBrowserTabToState,
    useCloseActiveBrowserTab,
    useHideActiveBrowserTab
} from '@tonkeeper/uikit/dist/state/dapp-browser';
import styled, { css } from 'styled-components';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { Body2, Body3 } from '@tonkeeper/uikit';
import { BrowserTabIdentifier } from '@tonkeeper/core/dist/service/dappBrowserService';
import { OptionalProperty } from '@tonkeeper/core/dist/utils/types';
import { IconButtonTransparentBackground } from '@tonkeeper/uikit/dist/components/fields/IconButton';
import {
    ArrowLeftIcon,
    ChevronDownIcon,
    CloseIcon,
    CopyIcon,
    DisconnectIcon,
    EllipsisIcon,
    RefreshIcon,
    ShareIcon
} from '@tonkeeper/uikit/dist/components/Icon';
import { asideWalletSelected$, useActiveWallet } from '@tonkeeper/uikit/dist/state/wallet';
import { tonConnectInjectedConnector } from '../../../libs/ton-connect/injected-connector';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { Dot } from '@tonkeeper/uikit/dist/components/Dot';
import { SelectDropDown } from '@tonkeeper/uikit/dist/components/fields/Select';
import {
    DropDownContent,
    DropDownItem,
    DropDownItemsDivider,
    DropDownRightIcon
} from '@tonkeeper/uikit/dist/components/DropDown';
import { CapacitorDappBrowser } from '../../../libs/plugins/dapp-browser-plugin';
import { useTranslation } from 'react-i18next';
import { originFromUrl } from '@tonkeeper/core/dist/service/tonConnect/connectService';
import { Share } from '@capacitor/share';
import {
    useDisconnectTonConnectApp,
    useInjectedDappConnectionByOrigin
} from '@tonkeeper/uikit/dist/state/tonConnect';

const Wrapper = styled.div`
    box-sizing: border-box;
    height: 100%;
    display: flex;
    flex-direction: column;

    > *:last-child {
        flex: 1;
    }
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
            <TabHeader tab={tab} />
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

const TabHeaderWrapper = styled.div`
    box-sizing: content-box;
    height: 32px;
    padding: env(safe-area-inset-top) 96px 4px 96px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background-color: ${p => p.theme.backgroundPage};
`;

const BackButton = styled(IconButtonTransparentBackground)`
    position: absolute;
    left: 0;
    padding: 8px 24px 8px 12px;
`;

const Title = styled(Body3)`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${p => p.theme.textSecondary};
`;

const RightButtonsGroup = styled.div`
    right: 0;
    position: absolute;
    display: flex;
`;

const HideTabButton = styled(IconButtonTransparentBackground)`
    padding: 8px 20px 8px 16px;
`;

const OptionsTabButton = styled(IconButtonTransparentBackground)`
    padding: 8px 8px 8px 20px;
`;

const TabHeader: FC<{ tab: BrowserTab | BrowserTabIdentifier }> = ({ tab }) => {
    const hostname = hostnameFromUrl(tab.url);
    const websiteTitle = 'title' in tab ? tab.title : '';
    const showTitle = Boolean(websiteTitle || hostname);

    const { mutate: hideTab } = useHideActiveBrowserTab();
    const { mutate: closeTab } = useCloseActiveBrowserTab();

    const onDrowDownStatusChange = useCallback((isOpen: boolean) => {
        CapacitorDappBrowser.setIsMainViewInFocus(isOpen);
    }, []);

    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { data: activeConnection } = useInjectedDappConnectionByOrigin(originFromUrl(tab.url));
    const { mutate } = useDisconnectTonConnectApp();

    return (
        <TabHeaderWrapper>
            <BackButton>
                <ArrowLeftIcon />
            </BackButton>
            {showTitle && (
                <Title>
                    {hostname}
                    {!!websiteTitle && (
                        <>
                            <Dot />
                            {websiteTitle}
                        </>
                    )}
                </Title>
            )}
            <RightButtonsGroup>
                <SelectDropDown
                    top="calc(100% + 12px)"
                    right="calc(-52px + 8px)"
                    onStatusChange={onDrowDownStatusChange}
                    payload={closeDropDown => (
                        <DropDownContent>
                            <DropDownItem
                                onClick={() => {
                                    closeDropDown();
                                    closeTab();
                                }}
                            >
                                {t('close')}
                                <DropDownRightIcon>
                                    <CloseIcon />
                                </DropDownRightIcon>
                            </DropDownItem>
                            <DropDownItemsDivider />
                            <DropDownItem
                                onClick={() => {
                                    closeDropDown();
                                    sdk.hapticNotification('success');
                                    CapacitorDappBrowser.reload({
                                        origin: originFromUrl(tab.url)!
                                    });
                                }}
                            >
                                {t('browser_actions_refresh')}
                                <DropDownRightIcon>
                                    <RefreshIcon />
                                </DropDownRightIcon>
                            </DropDownItem>
                            <DropDownItemsDivider />
                            <DropDownItem
                                onClick={() => {
                                    closeDropDown();
                                    sdk.hapticNotification('success');
                                    Share.share({
                                        url: tab.url
                                    });
                                }}
                            >
                                {t('browser_actions_share')}
                                <DropDownRightIcon>
                                    <ShareIcon />
                                </DropDownRightIcon>
                            </DropDownItem>
                            <DropDownItemsDivider />
                            <DropDownItem
                                onClick={() => {
                                    closeDropDown();
                                    sdk.copyToClipboard(tab.url);
                                }}
                            >
                                {t('browser_actions_copy_link')}
                                <DropDownRightIcon>
                                    <CopyIcon />
                                </DropDownRightIcon>
                            </DropDownItem>
                            {!!activeConnection && (
                                <>
                                    <DropDownItemsDivider />
                                    <DropDownItem
                                        onClick={() => {
                                            closeDropDown();
                                            mutate(activeConnection.connection);
                                        }}
                                    >
                                        {t('disconnect')}
                                        <DropDownRightIcon>
                                            <DisconnectIcon />
                                        </DropDownRightIcon>
                                    </DropDownItem>
                                </>
                            )}
                        </DropDownContent>
                    )}
                >
                    <OptionsTabButton>
                        <EllipsisIcon />
                    </OptionsTabButton>
                </SelectDropDown>
                <HideTabButton onClick={() => hideTab()}>
                    <ChevronDownIcon />
                </HideTabButton>
            </RightButtonsGroup>
        </TabHeaderWrapper>
    );
};

const hostnameFromUrl = (url: string) => {
    try {
        const data = new URL(url);
        return data.hostname;
    } catch (e) {
        return url;
    }
};
