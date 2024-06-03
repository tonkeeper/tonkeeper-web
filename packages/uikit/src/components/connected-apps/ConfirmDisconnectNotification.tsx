import { FC } from 'react';
import { Notification } from '../Notification';
import { styled } from 'styled-components';
import { Button } from '../fields/Button';
import { formatDappUrl } from './utils';
import { usePrevious } from '../../hooks/usePrevious';

const NotificationText = styled.div`
    text-align: center;
    margin-bottom: 24px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const ButtonsBlock = styled.div`
    display: flex;
    gap: 8px;

    > * {
        flex: 1;
    }
`;

export const ConfirmDisconnectNotification: FC<{
    isOpen: boolean;
    onClose: (confirmed?: boolean) => void;
    app?: { url: string } | 'all';
}> = ({ isOpen, onClose, app }) => {
    const prev = usePrevious(app);

    const appWithFallback = app || prev;

    return (
        <Notification isOpen={isOpen} handleClose={() => onClose(false)}>
            {() => (
                <>
                    <NotificationText>
                        {appWithFallback === 'all'
                            ? 'Disconnect all apps?'
                            : `Disconnect ${formatDappUrl(appWithFallback?.url)}?`}
                    </NotificationText>
                    <ButtonsBlock>
                        <Button secondary onClick={() => onClose(false)}>
                            Cancel
                        </Button>
                        <Button primary onClick={() => onClose(true)}>
                            Disconnect
                        </Button>
                    </ButtonsBlock>
                </>
            )}
        </Notification>
    );
};
