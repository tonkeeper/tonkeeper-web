import { FC, useCallback, useEffect, useState } from 'react';
import {
    BrowserTab,
    LoadingBrowserTab,
    useChangeBrowserTab,
    useCloseActiveBrowserTab,
    useHideActiveBrowserTab
} from '@tonkeeper/uikit/dist/state/dapp-browser';
import styled, { css } from 'styled-components';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { Body2, Body3, Label2, Label3 } from '@tonkeeper/uikit';
import {
    BrowserTabIdentifier,
    isBrowserTabLive
} from '@tonkeeper/core/dist/service/dappBrowserService';
import { IconButtonTransparentBackground } from '@tonkeeper/uikit/dist/components/fields/IconButton';
import {
    ArrowLeftIcon,
    ChevronDownIcon,
    CloseIcon,
    CopyIcon,
    DisconnectIcon,
    EllipsisIcon,
    PinIconOutline,
    RefreshIcon,
    ShareIcon,
    UnpinIconOutline
} from '@tonkeeper/uikit/dist/components/Icon';
import {
    asideWalletSelected$,
    getAccountWalletNameAndEmoji,
    useAccountsState,
    useActiveWallet
} from '@tonkeeper/uikit/dist/state/wallet';
import { capacitorTonConnectInjectedConnector } from '../../../libs/ton-connect/capacitor-injected-connector';
import { TonContract, WalletId } from '@tonkeeper/core/dist/entries/wallet';
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
import { WalletEmoji } from '@tonkeeper/uikit/dist/components/shared/emoji/WalletEmoji';
import { getAccountByWalletById } from '@tonkeeper/core/dist/entries/account';
import { useSubjectValue } from '@tonkeeper/uikit/dist/libs/useAtom';
import { AccountAndWalletInfo } from '@tonkeeper/uikit/dist/components/account/AccountAndWalletInfo';
import { AccountConnectionInjected } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { AnimatePresence, motion } from 'framer-motion';

const Wrapper = styled.div`
    box-sizing: border-box;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;

    > *:nth-child(2) {
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
    tab: BrowserTab | LoadingBrowserTab;
    isAnimating?: boolean;
}> = ({ tab, isAnimating }) => {
    const { title, iconUrl } = tab;
    const isLive = isBrowserTabLive(tab);
    const tabIsReady = !('type' in tab && tab.type === 'loading');
    const activeWallet = useActiveWallet();

    const asideLastSelectedWalletId = useSubjectValue(asideWalletSelected$);
    useEffect(() => {
        if (activeWallet.id === asideLastSelectedWalletId) {
            capacitorTonConnectInjectedConnector.changeConnectedWalletToActive(tab);
        }
    }, [activeWallet.id]);

    const { data: activeConnection } = useInjectedDappConnectionByOrigin(originFromUrl(tab.url));
    const [bannerData, setBannerData] = useState<WalletId | undefined>(undefined);
    const [runEffect, setRunEffect] = useState(0);
    useEffect(() => {
        if (!activeConnection) {
            setBannerData(undefined);
        } else {
            setBannerData(activeConnection.wallet.id);
            const timeout = setTimeout(() => {
                setBannerData(undefined);
            }, 2500);

            return () => {
                clearTimeout(timeout);
            };
        }
    }, [activeConnection, runEffect]);

    return (
        <Wrapper>
            <TabHeader
                tab={tab}
                activeConnection={activeConnection}
                onClickWallet={() => setRunEffect(c => c + 1)}
            />
            <BackgroundStyled $isTransparent={tabIsReady && !isAnimating}>
                {!isLive && (
                    <>
                        {iconUrl && <img src={iconUrl} />}
                        {title && <Body2>{title}</Body2>}
                    </>
                )}
            </BackgroundStyled>
            <ConnectedWalletTooltip walletId={bannerData} />
        </Wrapper>
    );
};

const TabHeaderWrapper = styled.div`
    box-sizing: content-box;
    height: 32px;
    padding: env(safe-area-inset-top) 0 4px 0;
    background-color: ${p => p.theme.backgroundPage};

    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    position: relative;
}

    .dd-select-container {
        max-height: unset;
        width: fit-content;
    }
`;

const BackButton = styled(IconButtonTransparentBackground)<{ $isHidden: boolean }>`
    width: 44px;
    box-sizing: border-box;
    padding: 8px 16px 8px 12px;
    flex-shrink: 0;

    ${p => p.$isHidden && 'visibility: hidden;'}
`;

const Title = styled(Body3)`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${p => p.theme.textSecondary};
    display: flex;
    align-items: center;
    justify-content: flex-start;
`;

const RightButtonsGroup = styled.div`
    display: flex;
    width: 96px;
    flex-shrink: 0;
`;

const HideTabButton = styled(IconButtonTransparentBackground)`
    padding: 8px 20px 8px 16px;
`;

const OptionsTabButton = styled(IconButtonTransparentBackground)`
    padding: 8px 8px 8px 20px;
`;

const DropDownItemStyled = styled(DropDownItem)`
    gap: 36px;
    white-space: nowrap;
`;

const TabHeader: FC<{
    tab: BrowserTab | BrowserTabIdentifier;
    activeConnection: { wallet: TonContract; connection: AccountConnectionInjected } | undefined;
    onClickWallet: () => void;
}> = ({ tab, activeConnection, onClickWallet }) => {
    const { mutate: hideTab } = useHideActiveBrowserTab();
    const { mutate: closeTab } = useCloseActiveBrowserTab();

    const onDrowDownStatusChange = useCallback((isOpen: boolean) => {
        CapacitorDappBrowser.setIsMainViewInFocus(isOpen);
    }, []);

    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { mutate: disconnect } = useDisconnectTonConnectApp();
    const { mutate: changeTab } = useChangeBrowserTab();

    return (
        <TabHeaderWrapper>
            <BackButton
                $isHidden={!isBrowserTabLive(tab) || !tab.canGoBack}
                onClick={() => CapacitorDappBrowser.goBack(tab.id)}
            >
                <ArrowLeftIcon />
            </BackButton>
            <HeaderTabInfo
                tab={tab}
                connectedWallet={activeConnection?.wallet}
                onClickWallet={onClickWallet}
            />
            <RightButtonsGroup>
                <SelectDropDown
                    top="calc(100% + 12px)"
                    right="calc(-52px + 8px)"
                    onStatusChange={onDrowDownStatusChange}
                    payload={closeDropDown => (
                        <DropDownContent>
                            <DropDownItemStyled
                                onClick={() => {
                                    closeDropDown();
                                    closeTab();
                                }}
                            >
                                <Label2>{t('close')}</Label2>
                                <DropDownRightIcon>
                                    <CloseIcon />
                                </DropDownRightIcon>
                            </DropDownItemStyled>
                            <DropDownItemsDivider />
                            <DropDownItemStyled
                                onClick={() => {
                                    closeDropDown();
                                    sdk.hapticNotification('success');
                                    CapacitorDappBrowser.reload({
                                        id: tab.id
                                    });
                                }}
                            >
                                <Label2>{t('browser_actions_refresh')}</Label2>
                                <DropDownRightIcon>
                                    <RefreshIcon />
                                </DropDownRightIcon>
                            </DropDownItemStyled>
                            <DropDownItemsDivider />
                            {'isPinned' in tab && (
                                <>
                                    <DropDownItemStyled
                                        onClick={() => {
                                            const isPinned = tab.isPinned;
                                            closeDropDown();
                                            changeTab({
                                                ...tab,
                                                isPinned: !tab.isPinned
                                            } as BrowserTab);
                                            sdk.topMessage(
                                                t(
                                                    isPinned
                                                        ? 'tab_action_toast_unpinned'
                                                        : 'tab_action_toast_pinned'
                                                )
                                            );
                                        }}
                                    >
                                        <Label2>
                                            {t(
                                                tab.isPinned
                                                    ? 'browser_actions_unpin'
                                                    : 'browser_actions_pin'
                                            )}
                                        </Label2>
                                        <DropDownRightIcon>
                                            {tab.isPinned ? (
                                                <UnpinIconOutline />
                                            ) : (
                                                <PinIconOutline />
                                            )}
                                        </DropDownRightIcon>
                                    </DropDownItemStyled>
                                    <DropDownItemsDivider />
                                </>
                            )}
                            <DropDownItemStyled
                                onClick={() => {
                                    closeDropDown();
                                    sdk.hapticNotification('success');
                                    Share.share({
                                        url: tab.url
                                    });
                                }}
                            >
                                <Label2>{t('browser_actions_share')}</Label2>
                                <DropDownRightIcon>
                                    <ShareIcon />
                                </DropDownRightIcon>
                            </DropDownItemStyled>
                            <DropDownItemsDivider />
                            <DropDownItemStyled
                                onClick={() => {
                                    closeDropDown();
                                    sdk.copyToClipboard(tab.url);
                                }}
                            >
                                <Label2>{t('browser_actions_copy_link')}</Label2>
                                <DropDownRightIcon>
                                    <CopyIcon />
                                </DropDownRightIcon>
                            </DropDownItemStyled>
                            {!!activeConnection && (
                                <>
                                    <DropDownItemsDivider />
                                    <DropDownItemStyled
                                        onClick={() => {
                                            closeDropDown();
                                            disconnect({ origin: originFromUrl(tab.url)! });
                                        }}
                                    >
                                        <Label2> {t('disconnect')}</Label2>
                                        <DropDownRightIcon>
                                            <DisconnectIcon />
                                        </DropDownRightIcon>
                                    </DropDownItemStyled>
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

const HeaderTabInfo: FC<{
    tab: BrowserTab | BrowserTabIdentifier;
    connectedWallet: TonContract | undefined;
    onClickWallet: () => void;
}> = ({ tab, connectedWallet, onClickWallet }) => {
    const hostname = hostnameFromUrl(tab.url);
    const websiteTitle = 'title' in tab ? tab.title : '';
    const showTitle = Boolean(websiteTitle || hostname);

    const { t } = useTranslation();
    const accounts = useAccountsState();
    const connectedAccount = connectedWallet
        ? getAccountByWalletById(accounts, connectedWallet.id)
        : undefined;

    if (!showTitle) {
        return null;
    }

    const walletInfo = connectedAccount
        ? getAccountWalletNameAndEmoji(connectedAccount, connectedWallet!.id)
        : undefined;

    return (
        <Title>
            <Spacer />
            {hostname}
            {walletInfo ? (
                <WalletClickZone onClick={onClickWallet}>
                    &nbsp;
                    {t('browser_using_wallet')}
                    <WalletEmoji emojiSize="14px" emoji={walletInfo.emoji} />
                    <WalletName>{walletInfo.name}</WalletName>
                </WalletClickZone>
            ) : (
                !!websiteTitle && (
                    <>
                        <Dot />
                        {websiteTitle}
                    </>
                )
            )}
        </Title>
    );
};

const WalletClickZone = styled.div`
    display: contents;
`;

const Spacer = styled.div`
    flex-shrink: 1;
    width: 52px;
    min-width: 0;
`;
const WalletName = styled(Label3)`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${p => p.theme.textPrimary};
`;

const hostnameFromUrl = (url: string) => {
    try {
        const data = new URL(url);
        return data.hostname;
    } catch (e) {
        return url;
    }
};

const ConnectedWalletTooltipWrapper = styled(motion.div)`
    position: absolute;
    bottom: 8px;
    left: 0;
    right: 0;
    padding: 0 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
`;

const ConnectedWalletTooltipBlock = styled.div`
    background: ${p => p.theme.backgroundContentTint};
    padding: 8px 12px;
    border-radius: ${p => p.theme.corner2xSmall};
    display: grid;
    overflow: hidden;
`;

const ConnectedWalletTooltip: FC<{ walletId?: WalletId }> = ({ walletId }) => {
    const { t } = useTranslation();
    const accounts = useAccountsState();
    const account = walletId === undefined ? undefined : getAccountByWalletById(accounts, walletId);

    return (
        <AnimatePresence>
            {!!account && (
                <ConnectedWalletTooltipWrapper
                    initial={{ opacity: 0, translateY: 50 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    exit={{ opacity: 0, translateY: 50 }}
                    transition={{ duration: 0.15, ease: 'linear' }}
                >
                    <ConnectedWalletTooltipBlock>
                        <Label2>{t('dapp_bowser_wallet_connected_toast')}</Label2>
                        <AccountAndWalletInfo account={account} walletId={walletId!} />
                    </ConnectedWalletTooltipBlock>
                </ConnectedWalletTooltipWrapper>
            )}
        </AnimatePresence>
    );
};
