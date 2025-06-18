import { FC, useState } from 'react';
import { styled } from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import {
    ConnectedDApp,
    useActiveWalletConnectedApps,
    useDisconnectTonConnectApp
} from '../../state/tonConnect';
import { ListBlock, ListItem } from '../List';
import { Body2, Body3, Label2 } from '../Text';
import { Button } from '../fields/Button';
import { ConfirmDisconnectNotification } from './ConfirmDisconnectNotification';
import { SpinnerRing } from '../Icon';
import { formatDappUrl } from './utils';

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

const SpinnerRingStyled = styled(SpinnerRing)`
    transform: scale(1.5);
    margin: 0 auto;
`;

export const ConnectedAppsList: FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    const { data: apps, refetch } = useActiveWalletConnectedApps();
    const [modalData, setModalData] = useState<{ origin: string } | undefined | 'all'>();
    const { mutateAsync: disconnectDapp, isLoading } = useDisconnectTonConnectApp();
    const isFullWidthMode = useIsFullWidthMode();

    const onCloseModal = async (isConfirmed?: boolean) => {
        if (isConfirmed) {
            if (modalData === 'all') {
                await disconnectDapp('all');
            } else {
                await disconnectDapp(modalData!);
            }
            await refetch();
        }
        setModalData(undefined);
    };

    if (!apps) {
        return (
            <FullHeightContainer className={className}>
                <SpinnerRingStyled />
            </FullHeightContainer>
        );
    }

    if (!apps.length) {
        return (
            <FullHeightContainer className={className}>
                <Body2Styled>{t('no_connected_apps')}</Body2Styled>
            </FullHeightContainer>
        );
    }

    const List = isFullWidthMode ? DesktopList : MobileList;

    return (
        <>
            <List
                apps={apps}
                onDisconnect={origin => setModalData({ origin })}
                className={className}
            />
            <ConfirmDisconnectNotification
                isOpen={!!modalData}
                isLoading={isLoading}
                onClose={onCloseModal}
                app={modalData}
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
    apps: ConnectedDApp[];
    onDisconnect: (appId: string) => void;
}> = ({ className, apps, onDisconnect }) => {
    const { t } = useTranslation();
    return (
        <ListBlock className={className}>
            {apps.map((app, index) => (
                <>
                    <MobileListItem hover={false} key={app.origin}>
                        <SafeDappImage src={app.icon} />
                        <DappTextBlock>
                            <Label2>{formatDappUrl(app.origin)}</Label2>
                            <Body3>{app.name}</Body3>
                        </DappTextBlock>
                        <DisconnectButton size="small" onClick={() => onDisconnect(app.origin)}>
                            {t('disconnect')}
                        </DisconnectButton>
                    </MobileListItem>
                    {index !== apps.length - 1 && <Divider />}
                </>
            ))}
        </ListBlock>
    );
};

const DesktopList: FC<{
    className?: string;
    apps: ConnectedDApp[];
    onDisconnect: (appId: string) => void;
}> = ({ className, apps, onDisconnect }) => {
    const { t } = useTranslation();
    return (
        <DesktopListContainer className={className}>
            {apps.map(app => (
                <DesktopListItem key={app.origin}>
                    <SafeDappImage src={app.icon} />
                    <DappTextBlock>
                        <Label2>{formatDappUrl(app.origin)}</Label2>
                        <Body3>{app.name}</Body3>
                    </DappTextBlock>
                    <DisconnectButton
                        secondary
                        size="small"
                        onClick={() => onDisconnect(app.origin)}
                    >
                        {t('disconnect')}
                    </DisconnectButton>
                </DesktopListItem>
            ))}
        </DesktopListContainer>
    );
};
