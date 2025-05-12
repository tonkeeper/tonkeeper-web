import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { ConnectedAppsList } from '../../components/connected-apps/ConnectedAppsList';
import { styled } from 'styled-components';
import {
    useActiveWalletTonConnectConnections,
    useDisconnectTonConnectApp
} from '../../state/tonConnect';
import { ConfirmDisconnectNotification } from '../../components/connected-apps/ConfirmDisconnectNotification';
import { useDisclosure } from '../../hooks/useDisclosure';
import { useTranslation } from '../../hooks/translation';

const DesktopViewPageLayoutStyled = styled(DesktopViewPageLayout)`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

const ConnectedAppsListStyled = styled(ConnectedAppsList)`
    flex: 1;
`;

export const DesktopConnectedAppsSettings = () => {
    const { t } = useTranslation();
    const { isOpen, onClose, onOpen } = useDisclosure();
    const { data: connections } = useActiveWalletTonConnectConnections();
    const { mutate } = useDisconnectTonConnectApp();

    const onCloseNotification = (confirmed?: boolean) => {
        if (confirmed) {
            mutate('all');
        }
        onClose();
    };

    const showDisconnectAll = !!connections?.length && connections.length > 1;

    return (
        <DesktopViewPageLayoutStyled>
            <DesktopViewHeader backButton>
                <DesktopViewHeaderContent
                    title={t('settings_connected_apps')}
                    right={
                        (showDisconnectAll || true) && (
                            <DesktopViewHeaderContent.Right>
                                <DesktopViewHeaderContent.RightItem
                                    asDesktopButton
                                    onClick={onOpen}
                                    closeDropDownOnClick
                                >
                                    {t('disconnect_all_apps')}
                                </DesktopViewHeaderContent.RightItem>
                            </DesktopViewHeaderContent.Right>
                        )
                    }
                />
            </DesktopViewHeader>
            <ConnectedAppsListStyled />
            <ConfirmDisconnectNotification
                isOpen={isOpen}
                onClose={onCloseNotification}
                app="all"
            />
        </DesktopViewPageLayoutStyled>
    );
};
