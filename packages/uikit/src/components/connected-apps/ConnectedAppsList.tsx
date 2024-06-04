import { styled } from 'styled-components';
import {
    useDisconnectTonConnectApp,
    useActiveWalletTonConnectConnections
} from '../../state/tonConnect';
import { Body2, Body3, Label2 } from '../Text';
import { FC, useState } from 'react';
import { Button } from '../fields/Button';
import { ConfirmDisconnectNotification } from './ConfirmDisconnectNotification';
import { AccountConnection } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { formatDappUrl } from './utils';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { ListBlock, ListItem } from '../List';
import { useTranslation } from '../../hooks/translation';

const DesktopListContainer = styled.ul`
    padding: 0;
    margin: 0;
`;

const DesktopListItem = styled.li`
    display: flex;
    padding: 0.5rem 1rem;
    align-items: center;
`;

const ImageStyled = styled.img`
    height: ${p => (p.theme.displayType === 'full-width' ? '40px' : '44px')};
    width: ${p => (p.theme.displayType === 'full-width' ? '40px' : '44px')};
    border-radius: ${p => (p.theme.displayType === 'full-width' ? '10px' : '12px')};
`;

const ImagePlaceholder = styled.div`
    height: ${p => (p.theme.displayType === 'full-width' ? '40px' : '44px')};
    width: ${p => (p.theme.displayType === 'full-width' ? '40px' : '44px')};
    background-color: ${p => p.theme.backgroundContent};
    border-radius: ${p => (p.theme.displayType === 'full-width' ? '10px' : '12px')};
`;

const FullHeightContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    ${p => p.theme.displayType === 'compact' && 'flex: 1;'}
`;

const Body2Styled = styled(Body2)`
    color: ${p => p.theme.textSecondary};
`;

const DappTextBlock = styled.div`
    padding-top: 0 !important;
    border: none !important;
    margin-left: ${p => (p.theme.displayType === 'full-width' ? '12px' : '16px')};
    display: flex;
    flex-direction: column;
    overflow: hidden;

    > ${Body3} {
        color: ${p => p.theme.textSecondary};
    }

    > * {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;

const SafeDappImage: FC<{ src: string }> = ({ src }) => {
    if (
        src.endsWith('.png') ||
        src.endsWith('.jpg') ||
        src.endsWith('.jpeg') ||
        src.endsWith('.webp')
    ) {
        return <ImageStyled src={src} />;
    } else {
        return <ImagePlaceholder />;
    }
};

const DisconnectButton = styled(Button)`
    margin-left: auto;
    height: 32px;
`;

export const ConnectedAppsList: FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    const { data: connections } = useActiveWalletTonConnectConnections();
    const [modalData, setModalData] = useState<AccountConnection | undefined | 'all'>();
    const { mutate: disconnectDapp } = useDisconnectTonConnectApp();
    const isFullWidthMode = useIsFullWidthMode();

    const onCloseModal = (isConfirmed?: boolean) => {
        if (isConfirmed) {
            if (modalData === 'all') {
                disconnectDapp('all');
            } else {
                disconnectDapp(modalData!);
            }
        }

        setModalData(undefined);
    };

    if (!connections) {
        return null;
    }

    if (!connections.length) {
        return (
            <FullHeightContainer className={className}>
                <Body2Styled>{t('no_connected_apps')}</Body2Styled>
            </FullHeightContainer>
        );
    }

    const List = isFullWidthMode ? DesktopList : MobileList;

    return (
        <>
            <List connections={connections} onDisconnect={setModalData} className={className} />
            <ConfirmDisconnectNotification
                isOpen={!!modalData}
                onClose={onCloseModal}
                app={
                    !!modalData && typeof modalData === 'object'
                        ? { url: modalData.manifest.url }
                        : modalData
                }
            />
        </>
    );
};

const MobileListItem = styled(ListItem)`
    display: flex;
    padding: 1rem;
    align-items: center;
`;

const Divider = styled.div`
    height: 1px;
    background-color: ${p => p.theme.separatorCommon};
    margin-left: 1rem;
`;

const MobileList: FC<{
    className?: string;
    connections: AccountConnection[];
    onDisconnect: (app: AccountConnection) => void;
}> = ({ className, connections, onDisconnect }) => {
    const { t } = useTranslation();
    return (
        <ListBlock className={className}>
            {connections.map((app, index) => (
                <>
                    <MobileListItem hover={false} key={app.clientSessionId}>
                        <SafeDappImage src={app.manifest.iconUrl} />
                        <DappTextBlock>
                            <Label2>{formatDappUrl(app.manifest.url)}</Label2>
                            <Body3>{app.manifest.name}</Body3>
                        </DappTextBlock>
                        <DisconnectButton size="small" onClick={() => onDisconnect(app)}>
                            {t('disconnect')}
                        </DisconnectButton>
                    </MobileListItem>
                    {index !== connections.length - 1 && <Divider />}
                </>
            ))}
        </ListBlock>
    );
};

const DesktopList: FC<{
    className?: string;
    connections: AccountConnection[];
    onDisconnect: (app: AccountConnection) => void;
}> = ({ className, connections, onDisconnect }) => {
    const { t } = useTranslation();
    return (
        <DesktopListContainer className={className}>
            {connections.map(app => (
                <DesktopListItem key={app.clientSessionId}>
                    <SafeDappImage src={app.manifest.iconUrl} />
                    <DappTextBlock>
                        <Label2>{formatDappUrl(app.manifest.url)}</Label2>
                        <Body3>{app.manifest.name}</Body3>
                    </DappTextBlock>
                    <DisconnectButton secondary size="small" onClick={() => onDisconnect(app)}>
                        {t('disconnect')}
                    </DisconnectButton>
                </DesktopListItem>
            ))}
        </DesktopListContainer>
    );
};
