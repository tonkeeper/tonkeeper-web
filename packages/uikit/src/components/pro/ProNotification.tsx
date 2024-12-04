import { FC } from 'react';
import { Notification } from '../Notification';
import { ProSettingsContent } from '../settings/ProSettings';
import { HideOnReview } from '../ios/HideOnReview';

export const ProNotification: FC<{ isOpen: boolean; onClose: (success?: boolean) => void }> = ({
    isOpen,
    onClose
}) => {
    return (
        <HideOnReview>
            <Notification isOpen={isOpen} handleClose={() => onClose()}>
                {() => <ProSettingsContent showLogo={false} onSuccess={() => onClose(true)} />}
            </Notification>
        </HideOnReview>
    );
};
