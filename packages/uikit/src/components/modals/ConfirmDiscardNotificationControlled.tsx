import { useCallback } from 'react';
import { createModalControl } from './createModalControl';
import { useAtom } from '../../libs/useAtom';
import { useTranslation } from '../../hooks/translation';
import { Button, Modal, ModalFooter, ModalFooterPortal } from '../../primitives';

const { hook, paramsControl } = createModalControl<{
    onClose(isDiscarded: boolean): void;
}>();

export const useConfirmDiscardNotification = hook;

export const ConfirmDiscardNotificationControlled = () => {
    const { t } = useTranslation();
    const { isOpen, onClose } = useConfirmDiscardNotification();
    const [params] = useAtom(paramsControl);

    const onContinue = useCallback(() => {
        onClose();
        params?.onClose(false);
    }, [onClose, params]);

    const onDiscard = useCallback(() => {
        onClose();
        params?.onClose(true);
    }, [onClose, params]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onContinue}
            heading={t('confirm_discard_title')}
            subheading={t('confirm_discard_description')}
        >
            <ModalFooterPortal>
                <ModalFooter>
                    <Button variant="destructive" size="large" fullWidth onClick={onDiscard}>
                        {t('confirm_discard_btn_discard')}
                    </Button>
                    <Button variant="secondary" size="large" fullWidth onClick={onContinue}>
                        {t('confirm_discard_btn_continue_editing')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </Modal>
    );
};
