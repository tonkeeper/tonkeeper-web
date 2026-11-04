import { FC, useState } from 'react';

import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { CloseButton } from '../../primitives/CloseButton';
import { Modal } from '../../primitives/Modal';
import { NumPad } from '../../primitives/NumPad';
import { PasscodeDots, PasscodeDotsState } from '../../primitives/PasscodeDots';

const PASSCODE_LENGTH = 4;
/** Matches the `animate-shake` duration, so the dots clear once the shake ends. */
const WRONG_RESET_MS = 420;

/**
 * Redesigned full-screen "Enter passcode" prompt of the mobile phone build,
 * the passcode counterpart of `EnterPasswordModal`. The code is submitted
 * as soon as the last digit is entered; the caller only decides whether it
 * is accepted.
 */
export const EnterPasscodeModal: FC<{
    isOpen: boolean;
    onCancel: () => void;
    /** Resolves `false` when the passcode is rejected: the dots shake and clear for a retry. */
    onSubmit: (passcode: string) => Promise<boolean>;
}> = ({ isOpen, onCancel, onSubmit }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const [passcode, setPasscode] = useState('');
    const [state, setState] = useState<PasscodeDotsState>('typing');
    const [isChecking, setIsChecking] = useState(false);

    const reset = () => {
        setPasscode('');
        setState('typing');
        setIsChecking(false);
    };

    const onDigit = async (digit: string) => {
        if (passcode.length >= PASSCODE_LENGTH || isChecking || state !== 'typing') return;
        sdk.hapticNotification('impact_light');
        const next = passcode + digit;
        setPasscode(next);
        if (next.length < PASSCODE_LENGTH) return;

        setIsChecking(true);
        const accepted = await onSubmit(next);
        setIsChecking(false);
        if (accepted) {
            setState('correct');
            sdk.hapticNotification('success');
            return;
        }
        setState('wrong');
        sdk.hapticNotification('error');
        setTimeout(() => {
            setPasscode('');
            setState('typing');
        }, WRONG_RESET_MS);
    };

    const onDelete = () => {
        if (isChecking || state !== 'typing') return;
        sdk.hapticNotification('impact_light');
        setPasscode(value => value.slice(0, -1));
    };

    return (
        <Modal isOpen={isOpen} onClose={onCancel} afterClose={reset} bare>
            <div className="flex h-full flex-col bg-backgroundPage pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
                <div className="flex h-16 shrink-0 items-center px-4">
                    <CloseButton onClick={onCancel} />
                </div>
                <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 pb-1">
                    <h2 className="text-center text-h3 text-textPrimary">
                        {t('migration_with_passcode')}
                    </h2>
                    <PasscodeDots length={PASSCODE_LENGTH} filled={passcode.length} state={state} />
                </div>
                <NumPad
                    onDigit={onDigit}
                    onDelete={onDelete}
                    canDelete={passcode.length > 0 && state === 'typing'}
                    disabled={isChecking || state !== 'typing'}
                    className="shrink-0"
                />
            </div>
        </Modal>
    );
};
