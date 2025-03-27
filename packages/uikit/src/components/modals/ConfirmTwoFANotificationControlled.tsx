import { createModalControl } from './createModalControl';
import { FC, useEffect, useState } from 'react';
import { useTwoFAServiceConfig, useTwoFAWalletConfigMayBeOfMultisigHost } from '../../state/two-fa';
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

    return (
        <NotificationStyled isOpen={isOpen} handleClose={onClose}>
            {() => <Content onClose={onClose} isOpen={isOpen} />}
        </NotificationStyled>
    );
};

const Content: FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { confirmMessageTGTtlSeconds } = useTwoFAServiceConfig();
    const { data: walletConfig } = useTwoFAWalletConfigMayBeOfMultisigHost();
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
        <>
            {!!authLink && creationTimeSeconds !== undefined && (
                <ConfirmView2FATelegramContent
                    validUntilSeconds={creationTimeSeconds + confirmMessageTGTtlSeconds}
                    onClose={onClose}
                    openTgLink={authLink}
                    creationTimeSeconds={creationTimeSeconds}
                />
            )}
        </>
    );
};
