import { FC } from 'react';

import { useTranslation } from '../../../../hooks/translation';
import IcImagePlaceholder64 from '../../../../icons/components/IcImagePlaceholder64';
import { Button, Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives';

/**
 * Confirmation gate for removing a connected dApp's access, shared by
 * both connection protocols.
 */
export const DisconnectAppSheet: FC<{
    isOpen: boolean;
    appName?: string;
    appIcon?: string;
    onDisconnect: () => void;
    onCancel: () => void;
}> = ({ isOpen, appName, appIcon, onDisconnect, onCancel }) => {
    const { t } = useTranslation();

    return (
        <Modal isOpen={isOpen} onClose={onCancel}>
            <div className="flex flex-col items-center pb-4 text-center">
                <span className="mb-5 flex size-[72px] items-center justify-center overflow-hidden rounded-[20px] bg-backgroundContent">
                    {appIcon ? (
                        <img src={appIcon} alt="" className="size-full object-cover" />
                    ) : (
                        <IcImagePlaceholder64 className="size-full text-iconTertiary" />
                    )}
                </span>
                <h3 className="text-h2 text-textPrimary">
                    {t('connect_disconnect_confirm_title', { name: appName ?? '' })}
                </h3>
                <p className="max-w-[300px] pt-1 text-body1 text-textSecondary">
                    {t('connect_disconnect_confirm_text', { name: appName ?? '' })}
                </p>
            </div>
            <ModalFooterPortal>
                <ModalFooter>
                    <Button variant="destructive" size="large" fullWidth onClick={onDisconnect}>
                        {t('disconnect')}
                    </Button>
                    <Button variant="secondary" size="large" fullWidth onClick={onCancel}>
                        {t('cancel')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </Modal>
    );
};
