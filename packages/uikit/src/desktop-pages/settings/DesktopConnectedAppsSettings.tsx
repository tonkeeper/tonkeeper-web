import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { Body2Class, Label2 } from '../../components/Text';
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

const DesktopViewHeaderStyled = styled(DesktopViewHeader)`
    padding-right: 0;
`;

const ConnectedAppsListStyled = styled(ConnectedAppsList)`
    flex: 1;
`;

const DisconnectAllButton = styled.button`
    border: none;
    outline: none;
    background: transparent;

    color: ${p => p.theme.accentBlue};
    padding: 4px 15px;
    ${Body2Class};
    margin-left: auto;
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
            <DesktopViewHeaderStyled backButton>
                <Label2>{t('settings_connected_apps')}</Label2>
                {showDisconnectAll && (
                    <DisconnectAllButton onClick={onOpen}>
                        {t('disconnect_all_apps')}
                    </DisconnectAllButton>
                )}
            </DesktopViewHeaderStyled>
            <ConnectedAppsListStyled />
            <ConfirmDisconnectNotification
                isOpen={isOpen}
                onClose={onCloseNotification}
                app="all"
            />
        </DesktopViewPageLayoutStyled>
    );
};
