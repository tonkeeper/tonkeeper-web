import {
    BrowserTab,
    useActiveBrowserTab,
    useBrowserTabs,
    useOpenBrowserTab
} from '../../../state/dapp-browser';
import { ForTargetEnv } from '../../shared/TargetEnv';
import { AsideMenuItem } from '../../shared/AsideItem';
import styled from 'styled-components';
import { Label2 } from '../../Text';
import { useMenuController } from '../../../hooks/ionic';

const AsideMenuItemStyled = styled(AsideMenuItem)`
    background: ${p =>
        p.isSelected
            ? p.theme.proDisplayType === 'desktop'
                ? p.theme.backgroundContentTint
                : p.theme.backgroundContent
            : 'unset'};
    padding-right: 50px;
    height: unset;

    ${Label2} {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    > img {
        flex-shrink: 0;
        height: 16px;
        width: 16px;
        border-radius: ${p => p.theme.corner2xSmall};
    }
`;

export const WalletAsideMenuBrowserTabs = () => {
    const { data: tabs } = useBrowserTabs();
    const openedTab = useActiveBrowserTab();
    const openedTabId = typeof openedTab === 'object' ? openedTab?.id : undefined;
    const { mutate: openTab } = useOpenBrowserTab();
    const { close: closeWalletMenu } = useMenuController('wallet-nav');

    const onClick = (tab: BrowserTab) => {
        closeWalletMenu();
        openTab(tab);
    };

    if (!tabs) {
        return null;
    }

    return (
        <ForTargetEnv env="mobile">
            {tabs.map(tab => (
                <AsideMenuItemStyled
                    key={tab.id}
                    isSelected={tab.id === openedTabId}
                    onClick={() => onClick(tab)}
                >
                    <img
                        src={tab.iconUrl}
                        onError={e => {
                            e.currentTarget.style.visibility = 'hidden';
                        }}
                    />
                    <Label2>{tab.title}</Label2>
                </AsideMenuItemStyled>
            ))}
        </ForTargetEnv>
    );
};
