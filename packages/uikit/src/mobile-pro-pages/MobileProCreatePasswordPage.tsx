import { MobileProPin } from '../components/mobile-pro/pin/MobileProPin';
import { FC, useRef, useState } from 'react';
import { hashAdditionalSecurityPassword } from '../state/global-preferences';
import {
    useCanPromptTouchId,
    useMutateSecuritySettings,
    useMutateTouchId
} from '../state/password';
import { childFactoryCreator, duration } from '../components/transfer/common';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import styled from 'styled-components';
import { Body1, H2 } from '../components/Text';
import { Button } from '../components/fields/Button';
import { SlideAnimation } from '../components/shared/SlideAnimation';

export const MobileProCreatePasswordPage = () => {
    const [pin, setPin] = useState('');
    const { mutateAsync } = useMutateSecuritySettings();
    const [pinSaved, setPinSaved] = useState(false);

    const { data: canPromptBiometrics } = useCanPromptTouchId();

    const setPinRef = useRef<HTMLDivElement>(null);
    const confirmPinRef = useRef<HTMLDivElement>(null);
    const biometricsRef = useRef<HTMLDivElement>(null);
    const [right, setRight] = useState(true);
    const [pinChecked, setPinChecked] = useState(false);
    const { mutateAsync: mutateTouchId } = useMutateTouchId({ skipPasswordCheck: true });

    const savePin = async () => {
        const additionalPasswordHash = await hashAdditionalSecurityPassword(pin);
        mutateAsync({ additionalPasswordHash });
    };

    const checkPin = (val: string) => {
        if (val !== pin) {
            return Promise.resolve(false);
        }

        setTimeout(() => {
            setPinSaved(true);
            if (!canPromptBiometrics) {
                savePin();
            }
        }, 400);
        setPinChecked(true);
        setRight(true);
        return Promise.resolve(true);
    };

    const onBack = () => {
        if (pinChecked) {
            return;
        }
        setRight(false);
        setPin('');
    };

    const view = pinSaved && canPromptBiometrics ? 'biometrics' : pin ? 'confirm_pin' : 'set_pin';
    const nodeRef =
        view === 'set_pin' ? setPinRef : view === 'confirm_pin' ? confirmPinRef : biometricsRef;
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
                        {view === 'set_pin' && (
                            <MobileProPin
                                title="Create Passcode"
                                onSubmit={v => {
                                    setRight(true);
                                    setPin(v);
                                }}
                            />
                        )}
                        {view === 'confirm_pin' && (
                            <MobileProPin
                                title="Repeat Passcode"
                                onSubmit={checkPin}
                                onBack={onBack}
                            />
                        )}
                        {view === 'biometrics' && (
                            <EnableBiometryPage onSubmit={v => mutateTouchId(v).finally(savePin)} />
                        )}
                    </div>
                </CSSTransition>
            </TransitionGroup>
        </Wrapper>
    );
};

const Wrapper = styled(SlideAnimation)`
    padding-bottom: env(safe-area-inset-bottom);
    padding-top: env(safe-area-inset-bottom);
    box-sizing: border-box;
    height: 100%;
`;

const BiometricsWrapper = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
`;

const BiometricsFirstBlockWrapper = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-bottom: 16px;
    max-width: 326px;
    text-align: center;
    margin: 0 auto;
    text-wrap: balance;

    > svg {
        color: ${p => p.theme.accentBlueConstant};
        margin-bottom: 16px;
    }

    > ${Body1} {
        color: ${p => p.theme.textSecondary};
    }
`;

const BiometricsSecondBlockWrapper = styled.div`
    padding: 16px 32px 32px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const EnableBiometryPage: FC<{ onSubmit: (val: boolean) => void }> = ({ onSubmit }) => {
    return (
        <BiometricsWrapper>
            <BiometricsFirstBlockWrapper>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="128"
                    height="128"
                    viewBox="0 0 128 128"
                    fill="none"
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M88.9652 16L84 16C81.7909 16 80 17.7909 80 20C80 22.2091 81.7909 24 84 24H88.8C92.2263 24 94.5555 24.0031 96.3558 24.1502C98.1095 24.2935 99.0063 24.5532 99.6319 24.872C101.137 25.6389 102.361 26.8628 103.128 28.3681C103.447 28.9937 103.707 29.8905 103.85 31.6442C103.997 33.4445 104 35.7737 104 39.2V44C104 46.2091 105.791 48 108 48C110.209 48 112 46.2091 112 44V39.0348C112 35.8151 112 33.1574 111.823 30.9927C111.64 28.7443 111.245 26.6775 110.256 24.7362C108.722 21.7256 106.274 19.2779 103.264 17.7439C101.323 16.7547 99.2557 16.3605 97.0073 16.1768C94.8425 15.9999 92.185 16 88.9652 16ZM49 50C49 47.7909 47.2091 46 45 46C42.7909 46 41 47.7909 41 50V56C41 58.2091 42.7909 60 45 60C47.2091 60 49 58.2091 49 56V50ZM68 49C68 47.3431 66.6569 46 65 46C63.3431 46 62 47.3431 62 49V63C62 64.0996 61.9977 64.7439 61.9589 65.2187C61.9392 65.4589 61.9149 65.5752 61.9045 65.6162C61.8369 65.7371 61.7371 65.8369 61.6162 65.9045C61.5752 65.9149 61.4589 65.9392 61.2187 65.9589C60.7439 65.9977 60.0996 66 59 66H58.75C57.0931 66 55.75 67.3431 55.75 69C55.75 70.6569 57.0931 72 58.75 72L59.1029 72C60.0644 72.0001 60.9581 72.0002 61.7073 71.9389C62.5181 71.8727 63.4199 71.7201 64.3144 71.2643C65.5845 70.6171 66.6171 69.5845 67.2643 68.3144C67.7201 67.4199 67.8727 66.5181 67.9389 65.7073C68.0002 64.9581 68.0001 64.0644 68 63.1029L68 63V49ZM47.8787 76.8786C49.0481 75.7092 50.9424 75.7067 52.1145 76.8719L65.1754 76.8731L52.1169 76.8742C52.1758 76.9311 52.2357 76.9871 52.2962 77.0423C52.4396 77.1732 52.6642 77.3718 52.9622 77.6156C53.5606 78.1052 54.4416 78.7663 55.5435 79.4275C57.7777 80.768 60.7377 82 64 82C67.2623 82 70.2223 80.768 72.4565 79.4275C73.5584 78.7663 74.4394 78.1052 75.0378 77.6156C75.3277 77.3784 75.6134 77.1344 75.8831 76.8742L65.1754 76.8731L75.8851 76.8723C77.0571 75.7071 78.9519 75.7092 80.1213 76.8786C81.2929 78.0502 81.2929 79.9497 80.1213 81.1213L80.1199 81.1227L80.1147 81.1279L80.1057 81.1368L80.0812 81.1609C79.9458 81.2935 79.5191 81.7014 78.8372 82.2593C78.0606 82.8948 76.9416 83.7336 75.5435 84.5724C72.7777 86.2319 68.7377 88 64 88C59.2623 88 55.2223 86.2319 52.4565 84.5724C51.0584 83.7336 49.9394 82.8948 49.1628 82.2593C48.4809 81.7014 48.0542 81.2935 47.9188 81.1609L47.8943 81.1368L47.8853 81.1279L47.8801 81.1227L47.8787 81.1213C46.7071 79.9497 46.7071 78.0502 47.8787 76.8786ZM83 46C85.2091 46 87 47.7909 87 50V56C87 58.2091 85.2091 60 83 60C80.7909 60 79 58.2091 79 56V50C79 47.7909 80.7909 46 83 46ZM88.9652 112H84C81.7909 112 80 110.209 80 108C80 105.791 81.7909 104 84 104H88.8C92.2263 104 94.5555 103.997 96.3558 103.85C98.1095 103.707 99.0063 103.447 99.6319 103.128C101.137 102.361 102.361 101.137 103.128 99.6319C103.447 99.0063 103.707 98.1095 103.85 96.3558C103.997 94.5555 104 92.2263 104 88.8V84C104 81.7909 105.791 80 108 80C110.209 80 112 81.7909 112 84V88.9652C112 92.1849 112 94.8426 111.823 97.0073C111.64 99.2557 111.245 101.323 110.256 103.264C108.722 106.274 106.274 108.722 103.264 110.256C101.323 111.245 99.2557 111.64 97.0073 111.823C94.8426 112 92.1849 112 88.9652 112ZM44 112H39.0348C35.8151 112 33.1574 112 30.9927 111.823C28.7443 111.64 26.6775 111.245 24.7362 110.256C21.7256 108.722 19.2779 106.274 17.7439 103.264C16.7547 101.323 16.3605 99.2557 16.1768 97.0073C15.9999 94.8425 16 92.1851 16 88.9653L16 84C16 81.7909 17.7909 80 20 80C22.2091 80 24 81.7909 24 84V88.8C24 92.2263 24.0031 94.5555 24.1502 96.3558C24.2935 98.1095 24.5532 99.0063 24.872 99.6319C25.6389 101.137 26.8628 102.361 28.3681 103.128C28.9937 103.447 29.8905 103.707 31.6442 103.85C33.4445 103.997 35.7737 104 39.2 104H44C46.2091 104 48 105.791 48 108C48 110.209 46.2091 112 44 112ZM44 16L39.0348 16C35.815 16 33.1575 15.9999 30.9927 16.1768C28.7443 16.3605 26.6775 16.7547 24.7362 17.7439C21.7256 19.2779 19.2779 21.7256 17.7439 24.7362C16.7547 26.6775 16.3605 28.7443 16.1768 30.9927C15.9999 33.1575 16 35.8149 16 39.0347L16 44C16 46.2091 17.7909 48 20 48C22.2091 48 24 46.2091 24 44V39.2C24 35.7737 24.0031 33.4445 24.1502 31.6442C24.2935 29.8905 24.5532 28.9937 24.872 28.3681C25.6389 26.8628 26.8628 25.6389 28.3681 24.872C28.9937 24.5532 29.8905 24.2935 31.6442 24.1502C33.4445 24.0031 35.7737 24 39.2 24H44C46.2091 24 48 22.2091 48 20C48 17.7909 46.2091 16 44 16Z"
                        fill="currentColor"
                    />
                </svg>
                <H2>Quick sign-in with Face ID</H2>
                <Body1>
                    Face ID allows you to open your wallet faster without having to enter your
                    password.
                </Body1>
            </BiometricsFirstBlockWrapper>
            <BiometricsSecondBlockWrapper>
                <Button primary fullWidth size="large" onClick={() => onSubmit(true)}>
                    Enable Face ID
                </Button>
                <Button secondary fullWidth size="large" onClick={() => onSubmit(false)}>
                    Later
                </Button>
            </BiometricsSecondBlockWrapper>
        </BiometricsWrapper>
    );
};
