import { FC } from 'react';
import { Notification } from '../Notification';
import { ProSettingsContent } from '../settings/ProSettings';

export const ProNotification: FC<{ isOpen: boolean; onClose: (success?: boolean) => void }> = ({
    isOpen,
    onClose
}) => {
    return (
        <Notification isOpen={isOpen} handleClose={() => onClose()}>
            {() => <ProSettingsContent showLogo={false} onSuccess={() => onClose(true)} />}
        </Notification>
    );
};
