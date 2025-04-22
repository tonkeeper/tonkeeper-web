import { FC, useMemo, useRef, useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { childFactoryCreator, duration } from '../../transfer/common';
import { MobileProPin } from './MobileProPin';
import styled from 'styled-components';
import { SlideAnimation } from '../../shared/SlideAnimation';
import { useTranslation } from '../../../hooks/translation';
import { Notification, useSetNotificationOnBack } from '../../Notification';
import { useAppSdk } from '../../../hooks/appSdk';

export const MobileProChangePin: FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    const [oldPinChecked, setOldPinChecked] = useState(false);

    const [pin, setPin] = useState('');

    const oldPinRef = useRef<HTMLDivElement>(null);
    const setPinRef = useRef<HTMLDivElement>(null);
    const confirmPinRef = useRef<HTMLDivElement>(null);
    const [right, setRight] = useState(true);
    const [newPinChecked, setNewPinChecked] = useState(false);

    const checkNewPin = (val: string) => {
        if (val !== pin) {
            return Promise.resolve(false);
        }

        setTimeout(async () => {
            await sdk.keychain?.updatePassword(pin);
            onComplete();
        }, 400);
        setNewPinChecked(true);
        setRight(true);
        return Promise.resolve(true);
    };

    const onBack = useMemo(() => {
        if (!oldPinChecked || !pin || newPinChecked) {
            return undefined;
        }

        return () => {
            setRight(false);
            setPin('');
        };
    }, [oldPinChecked, pin, newPinChecked]);

    useSetNotificationOnBack(onBack);

    const view = !oldPinChecked ? 'old_pin' : pin ? 'confirm_pin' : 'set_pin';
    const nodeRef =
        view === 'set_pin' ? setPinRef : view === 'confirm_pin' ? confirmPinRef : oldPinRef;
    return (
        <Wrapper>
            <TransitionGroup childFactory={childFactoryCreator(right)} style={{ height: '100%' }}>
                <CSSTransition
                    key={view}
                    nodeRef={nodeRef}
                    classNames="right-to-left"
                    addEndListener={done => {
                        setTimeout(done, duration);
                    }}
                >
                    <div ref={nodeRef} style={{ height: '100%' }}>
                        {view === 'old_pin' && (
                            <MobileProPin
                                title={t('create_pin_current_title')}
                                onSubmit={async v => {
                                    setRight(true);
                                    const isCorrect = await sdk.keychain!.checkPassword(v);
                                    if (isCorrect) {
                                        setOldPinChecked(true);
                                    }
                                    return isCorrect;
                                }}
                            />
                        )}
                        {view === 'set_pin' && (
                            <MobileProPin
                                title={t('create_pin_new_title')}
                                onSubmit={v => {
                                    setRight(true);
                                    setPin(v);
                                }}
                            />
                        )}
                        {view === 'confirm_pin' && (
                            <MobileProPin
                                title={t('create_pin_repeat_title')}
                                onSubmit={checkNewPin}
                            />
                        )}
                    </div>
                </CSSTransition>
            </TransitionGroup>
        </Wrapper>
    );
};

const Wrapper = styled(SlideAnimation)`
    height: 100%;
`;

export const MobileProChangePinNotification: FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    return (
        <Notification isOpen={isOpen} handleClose={onClose} mobileFullScreen>
            {() => <MobileProChangePin onComplete={onClose} />}
        </Notification>
    );
};
