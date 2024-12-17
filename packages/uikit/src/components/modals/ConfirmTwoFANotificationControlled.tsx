import { createModalControl } from './createModalControl';
import React, { useEffect, useState } from 'react';
import { useTwoFAServiceConfig, useTwoFAWalletConfig } from '../../state/two-fa';
import styled from 'styled-components';
import { Notification } from '../Notification';
import { ConfirmView2FATelegramContent } from '../transfer/nft/ConfirmView2FATelegram';

const { hook } = createModalControl();

export const useConfirmTwoFANotification = hook;

const NotificationStyled = styled(Notification)`
    .dialog-header {
        padding-bottom: 0;
    }
`;

export const ConfirmTwoFANotificationControlled = () => {
    const { isOpen, onClose } = useConfirmTwoFANotification();
    const { confirmMessageTGTtlSeconds } = useTwoFAServiceConfig();
    const { data: walletConfig } = useTwoFAWalletConfig();
    const authLink = walletConfig && 'botUrl' in walletConfig ? walletConfig.botUrl : undefined;

    const [creationTimeSeconds, setCreationTimeSeconds] = useState<number>();

    useEffect(() => {
        if (isOpen) {
            setCreationTimeSeconds(Math.round(Date.now() / 1000));
        } else {
            setCreationTimeSeconds(undefined);
        }
    }, [isOpen, confirmMessageTGTtlSeconds]);

    return (
        <NotificationStyled isOpen={creationTimeSeconds !== undefined} handleClose={onClose}>
            {() =>
                !!authLink &&
                creationTimeSeconds !== undefined && (
                    <ConfirmView2FATelegramContent
                        validUntilSeconds={creationTimeSeconds + confirmMessageTGTtlSeconds}
                        onClose={onClose}
                        openTgLink={authLink}
                        creationTimeSeconds={creationTimeSeconds}
                    />
                )
            }
        </NotificationStyled>
    );
};
