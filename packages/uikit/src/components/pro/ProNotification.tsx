import { FC } from 'react';
import { Notification } from '../Notification';
import { ProSettingsContent } from '../settings/ProSettings';

export const ProNotification: FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    return (
        <Notification isOpen={isOpen} handleClose={onClose}>
            {() => <ProSettingsContent />}
        </Notification>
    );
};
