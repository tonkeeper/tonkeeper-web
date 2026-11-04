import { Notification } from '../Notification';
import { useAtom } from '../../libs/useAtom';
import { useTranslation } from '../../hooks/translation';
import { createModalControl } from './createModalControl';
import { MobileProPin } from '../mobile-pro/pin/MobileProPin';
import { useActiveAccountQuery } from '../../state/wallet';
import { EnterPasscodeModal } from './EnterPasscodeModal';

const { hook, paramsControl, controller } = createModalControl<{
    afterClose: (pin?: string) => void | Promise<boolean | undefined>;
}>();

export const promptMobileProPinController = controller;

export const usePromptMobileProPin = hook;

/**
 * Keychain passcode prompt of the mobile phone build, opened imperatively by
 * its keychain (`promptMobileProPinController`) whenever a security check
 * needs the passcode. Renders the redesigned modal for multichain accounts
 * and the legacy sheet for every other account type.
 */
export const PromptMobileProPinNotificationControlled = () => {
    const { data: activeAccount } = useActiveAccountQuery();

    if (activeAccount?.type === 'multichain') {
        return <PromptPasscodeMultichain />;
    }
    return <PromptPinLegacy />;
};

const PromptPasscodeMultichain = () => {
    const { isOpen, onClose } = usePromptMobileProPin();
    const [params] = useAtom(paramsControl);

    const onCancel = () => {
        onClose();
        params?.afterClose?.();
    };

    const onSubmit = async (passcode: string) => {
        if (!params?.afterClose) {
            onClose();
            return true;
        }

        const resultPromise = params.afterClose(passcode);
        if (!(resultPromise instanceof Promise)) {
            onClose();
            return true;
        }

        const isValid = await resultPromise;
        if (isValid === false) {
            return false;
        }
        onClose();
        return true;
    };

    return <EnterPasscodeModal isOpen={isOpen} onCancel={onCancel} onSubmit={onSubmit} />;
};

const PromptPinLegacy = () => {
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
            onTopOfBrowser
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
