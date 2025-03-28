import { Notification } from '../Notification';
import { useAtom } from '../../libs/atom';
import { useTranslation } from '../../hooks/translation';
import { createModalControl } from './createModalControl';
import { MobileProPin } from '../mobile-pro/pin/MobileProPin';

const { hook, paramsControl } = createModalControl<{
    afterClose: (pin?: string) => void | Promise<boolean | undefined>;
}>();

export const usePromptMobileProPin = hook;

export const PromptMobileProPinNotificationControlled = () => {
    const { isOpen, onClose } = usePromptMobileProPin();
    const { t } = useTranslation();
    const [params] = useAtom(paramsControl);

    return (
        <Notification
            isOpen={isOpen}
            handleClose={() => {
                onClose();
                params?.afterClose?.();
            }}
            mobileFullScreen
        >
            {() => (
                <MobileProPin
                    title={t('migration_with_passcode')}
                    onSubmit={pin => {
                        if (!params?.afterClose) {
                            onClose();
                            return;
                        }

                        const result = params.afterClose(pin);
                        if (result instanceof Promise) {
                            result.then(isValid => {
                                if (isValid !== false) {
                                    onClose();
                                }
                            });
                            return result;
                        } else {
                            onClose();
                        }
                    }}
                />
            )}
        </Notification>
    );
};
