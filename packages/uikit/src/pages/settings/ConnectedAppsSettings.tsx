import { SubHeader } from '../../components/SubHeader';
import { InnerBody } from '../../components/Body';
import React from 'react';
import { useTranslation } from '../../hooks/translation';
import { styled } from 'styled-components';
import { ConnectedAppsList } from '../../components/connected-apps/ConnectedAppsList';
import {
    useActiveWalletTonConnectConnections,
    useDisconnectTonConnectApp
} from '../../state/tonConnect';
import { Button } from '../../components/fields/Button';
import { ConfirmDisconnectNotification } from '../../components/connected-apps/ConfirmDisconnectNotification';
import { useDisclosure } from '../../hooks/useDisclosure';

const InnerBodyStyled = styled(InnerBody)`
    display: flex;
    flex-direction: column;
`;

const DisconnectAllButtonStyled = styled(Button)`
    height: 56px;
    border-radius: ${p => p.theme.cornerSmall};
    margin-bottom: 1rem;
`;

export const ConnectedAppsSettings = () => {
    const { t } = useTranslation();
    const { isOpen, onClose, onOpen } = useDisclosure();
    const { mutate } = useDisconnectTonConnectApp();
    const { data: connections } = useActiveWalletTonConnectConnections();

    const showDisconnectAll = !!connections?.length && connections.length > 1;

    const onCloseNotification = (confirmed?: boolean) => {
        if (confirmed) {
            mutate('all');
        }
        onClose();
    };

    return (
        <>
            <SubHeader title={t('connected_apps_short')} />
            <InnerBodyStyled>
                {showDisconnectAll && (
                    <DisconnectAllButtonStyled secondary onClick={onOpen}>
                        {t('disconnect_all_apps')}
                    </DisconnectAllButtonStyled>
                )}
                <ConnectedAppsList />
                <ConfirmDisconnectNotification
                    isOpen={isOpen}
                    onClose={onCloseNotification}
                    app="all"
                />
            </InnerBodyStyled>
        </>
    );
};
