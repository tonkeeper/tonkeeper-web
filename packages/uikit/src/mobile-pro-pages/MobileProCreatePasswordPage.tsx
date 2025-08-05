import { MobileProPin } from '../components/mobile-pro/pin/MobileProPin';
import { FC, useRef, useState } from 'react';
import { useCanPromptTouchId } from '../state/password';
import { childFactoryCreator, duration } from '../components/transfer/common';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import styled, { useTheme } from 'styled-components';
import { Body2, H3 } from '../components/Text';
import { Button } from '../components/fields/Button';
import { SlideAnimation } from '../components/shared/SlideAnimation';
import { useTranslation } from '../hooks/translation';
import { useAppSdk } from '../hooks/appSdk';

export const MobileProCreatePasswordPage = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const [pin, setPin] = useState('');
    const [pinSaved, setPinSaved] = useState(false);

    const { data: canPromptBiometrics } = useCanPromptTouchId();

    const setPinRef = useRef<HTMLDivElement>(null);
    const confirmPinRef = useRef<HTMLDivElement>(null);
    const biometricsRef = useRef<HTMLDivElement>(null);
    const tutorialRef = useRef<HTMLDivElement>(null);
    const freeProRef = useRef<HTMLDivElement>(null);
    const [right, setRight] = useState(true);
    const [pinChecked, setPinChecked] = useState(false);
    const [pinCompleted, setPinCompleted] = useState(false);

    const finish = async () => sdk.keychain!.updatePassword(pin);

    const checkPin = (val: string) => {
        if (val !== pin) {
            return Promise.resolve(false);
        }

        setTimeout(() => {
            setPinSaved(true);
            if (!canPromptBiometrics) {
                setPinCompleted(true);
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

    let view;

    switch (true) {
        case pinCompleted: {
            view = 'tutorial';
            break;
        }
        case pinSaved && canPromptBiometrics:
            view = 'biometrics';
            break;
        case !!pin:
            view = 'confirm_pin';
            break;
        default:
            view = 'set_pin';
            break;
    }

    const nodeRef = {
        set_pin: setPinRef,
        confirm_pin: confirmPinRef,
        biometrics: biometricsRef,
        tutorial: tutorialRef,
        free_pro: freeProRef
    }[view];

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
                                title={t('create_pin_title')}
                                onSubmit={v => {
                                    setRight(true);
                                    setPin(v);
                                }}
                            />
                        )}
                        {view === 'confirm_pin' && (
                            <MobileProPin
                                title={t('create_pin_repeat_title')}
                                onSubmit={checkPin}
                                onBack={onBack}
                            />
                        )}
                        {view === 'biometrics' && (
                            <EnableBiometryPage
                                onSubmit={v =>
                                    sdk
                                        .keychain!.setBiometry(v)
                                        .finally(() => setPinCompleted(true))
                                }
                            />
                        )}
                        {view === 'tutorial' && <TutorialScreen onSubmit={finish} />}
                    </div>
                </CSSTransition>
            </TransitionGroup>
        </Wrapper>
    );
};

const FullScreenWrapper = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 0 32px;
`;

const Wrapper = styled(SlideAnimation)`
    padding-bottom: env(safe-area-inset-bottom);
    padding-top: env(safe-area-inset-top);
    box-sizing: border-box;
    height: 100%;
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
        margin: 0 -32px 16px;
    }

    > ${Body2} {
        color: ${p => p.theme.textSecondary};
    }
`;

const LaterButton = styled(Button)`
    position: absolute;
    top: 8px;
    right: 16px;
`;

const SecondBlockWrapper = styled.div`
    padding: 16px 0 32px;
    width: 100%;
`;

const EnableBiometryPage: FC<{ onSubmit: (val: boolean) => void }> = ({ onSubmit }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    return (
        <FullScreenWrapper>
            <LaterButton secondary onClick={() => onSubmit(false)}>
                {t('later')}
            </LaterButton>
            <BiometricsFirstBlockWrapper>
                <svg
                    width="326"
                    height="180"
                    viewBox="0 0 326 180"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M34 116C34 104.766 34.0016 96.4607 34.5383 89.8909C35.0732 83.3445 36.1295 78.6977 38.1418 74.7484C41.7849 67.5982 47.5982 61.7849 54.7484 58.1418C58.6977 56.1295 63.3445 55.0732 69.8909 54.5383C76.4607 54.0016 84.7659 54 96 54H230C241.234 54 249.539 54.0016 256.109 54.5383C262.655 55.0732 267.302 56.1295 271.252 58.1418C278.402 61.7849 284.215 67.5982 287.858 74.7484C289.871 78.6977 290.927 83.3445 291.462 89.8909C291.998 96.4607 292 104.766 292 116V146H34V116Z"
                        stroke={theme.iconTertiary}
                        strokeWidth="4"
                    />
                    <rect y="68" width="326" height="76" fill="url(#paint0_linear_56970_570233)" />
                    <rect y="144" width="326" height="4" fill="black" />
                    <rect
                        x="97.5"
                        y="0.5"
                        width="131"
                        height="131"
                        rx="31.5"
                        fill={theme.backgroundContent}
                    />
                    <rect
                        x="97.5"
                        y="0.5"
                        width="131"
                        height="131"
                        rx="31.5"
                        stroke={theme.iconTertiary}
                    />
                    <path
                        d="M127.513 57.3052C129.293 57.9644 130.809 57.0415 131.436 55.4595C136.577 41.8804 148.541 33.2451 162.878 33.2451C168.613 33.2451 172.832 34.3328 176.919 36.1785C178.864 37.0684 180.544 37.0684 181.303 35.3875C181.929 34.0691 181.467 32.6519 179.819 31.6631C174.414 28.532 169.338 27.5762 162.878 27.5762C145.608 27.5762 132.128 37.0354 125.964 52.8557C125.206 54.8003 125.898 56.7449 127.513 57.3052ZM132.358 88.5833C133.347 89.9346 135.259 90.1653 136.577 89.0447C139.181 86.8694 140.631 83.2769 140.631 79.2229C140.631 74.345 138.555 71.8071 138.555 66.27C138.555 52.8887 149.497 41.9463 162.878 41.9463C178.534 41.9463 188.949 54.9321 188.949 74.5427C188.949 82.5847 187.598 87.8252 186.477 90.4949C185.851 91.9121 186.378 93.593 187.763 94.2522C189.213 95.0103 191.124 94.3181 191.685 92.7361C192.937 89.4731 194.618 83.4087 194.618 74.5098C194.618 51.6033 181.896 36.3103 162.878 36.3103C146.399 36.3103 132.886 49.7905 132.886 66.27C132.886 71.9719 135.061 75.7952 135.094 79.1899C135.094 81.4641 134.204 83.3428 132.919 84.6611C131.765 85.8806 131.502 87.3967 132.358 88.5833ZM199.99 70.9172C201.638 70.9172 202.759 69.5659 202.627 67.885C201.408 53.4819 196.694 45.1763 188.685 37.4639C187.466 36.2773 185.62 36.4751 184.631 37.6946C183.544 38.8481 183.774 40.4961 185.027 41.7156C192.179 48.9006 196.134 56.7449 197.156 68.0828C197.354 69.7637 198.474 70.9172 199.99 70.9172ZM149.168 74.345C148.278 72.0708 147.322 69.5989 147.322 66.27C147.322 57.7007 154.309 50.6804 162.878 50.6804C166.076 50.6804 167.031 50.9771 169.635 52.0977C171.118 52.7568 172.535 52.3284 173.129 51.1089C173.887 49.6917 173.491 47.9778 171.876 47.0879C169.47 45.6707 166.636 45.0115 162.878 45.0115C151.211 45.0115 141.62 54.6355 141.62 66.27C141.62 70.0933 142.675 73.9165 143.597 76.4873C144.224 78.1682 145.938 78.8274 147.618 78.1682C149.102 77.6079 149.695 75.9929 149.168 74.345ZM175.897 57.47C178.765 62.2161 180.314 68.1487 180.314 76.2236C180.314 84.8589 178.007 93.0986 174.315 97.5481C173.326 98.8005 173.392 100.481 174.447 101.47C175.7 102.624 177.677 102.459 178.666 101.141C183.148 95.1421 185.917 85.6499 185.917 76.0918C185.917 64.688 183.511 59.4475 180.775 54.4707C179.918 52.9546 178.138 52.4272 176.754 53.1523C175.172 53.9434 174.941 55.9209 175.897 57.47ZM149.102 99.8552C154.968 95.1421 158.297 87.5286 158.264 79.157C158.231 72.7959 156.023 69.0056 156.023 65.8745C156.023 61.9524 158.759 59.4146 162.878 59.4146C168.383 59.4146 171.118 65.1494 171.448 75.96C171.81 85.8477 168.416 95.241 163.043 99.8552C161.857 100.844 161.593 102.426 162.384 103.678C163.373 105.063 165.35 105.326 166.603 104.107C172.601 98.7017 176.82 86.9683 176.787 75.5974C176.721 61.5239 172.107 53.7786 162.878 53.7786C155.66 53.7786 150.453 58.6235 150.453 65.4131C150.453 69.5989 152.529 74.4438 152.595 79.157C152.628 85.8806 150.123 91.7803 145.608 95.4387C144.356 96.4934 144.092 98.0425 144.949 99.3608C145.971 100.811 147.816 100.943 149.102 99.8552ZM129.293 78.7944C130.711 78.333 131.436 76.8499 131.106 75.2349C130.216 71.6423 129.788 68.9397 129.854 64.3584C129.854 62.8423 128.865 61.6228 127.415 61.3921C125.734 61.1614 124.284 62.249 124.152 64.1606C123.921 68.2146 124.316 71.9719 125.668 76.7839C126.129 78.4319 127.744 79.2888 129.293 78.7944ZM167.064 82.6836C167.855 77.6409 167.559 72.0378 165.878 66.6326C165.35 64.9187 163.867 64.0947 162.318 64.5891C160.802 65.0176 160.011 66.5007 160.472 68.0828C161.923 73.1584 162.153 77.3772 161.494 81.8267C161.263 83.4087 162.055 84.8589 163.702 85.1226C165.317 85.3862 166.801 84.3645 167.064 82.6836ZM141.686 95.2739C144.652 93.7908 147.849 89.4072 148.937 86.0454C149.431 84.5293 148.607 82.9143 147.19 82.4199C145.74 81.9255 144.257 82.7825 143.663 84.3645C142.741 86.8694 141.356 88.7151 139.115 90.3301C137.698 91.3848 137.138 92.769 137.698 94.1533C138.357 95.6365 140.071 96.1309 141.686 95.2739ZM157.407 102.657C160.143 100.613 162.747 96.9219 164.395 92.8679C165.054 91.187 164.362 89.5061 162.911 89.0447C161.198 88.4185 159.846 89.3083 159.121 90.9563C157.869 93.7908 156.32 96.0649 153.947 98.0754C152.727 99.0972 152.43 100.745 153.254 102.031C154.078 103.316 155.99 103.646 157.407 102.657Z"
                        fill={theme.iconPrimary}
                    />
                    <defs>
                        <linearGradient
                            id="paint0_linear_56970_570233"
                            x1="163"
                            y1="68"
                            x2="163"
                            y2="144"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop stopOpacity="0" />
                            <stop offset="0.0666667" stopOpacity="0.01" />
                            <stop offset="0.133333" stopOpacity="0.03551" />
                            <stop offset="0.2" stopOpacity="0.0816599" />
                            <stop offset="0.266667" stopOpacity="0.147411" />
                            <stop offset="0.333333" stopOpacity="0.231775" />
                            <stop offset="0.4" stopOpacity="0.331884" />
                            <stop offset="0.466667" stopOpacity="0.442691" />
                            <stop offset="0.533333" stopOpacity="0.557309" />
                            <stop offset="0.6" stopOpacity="0.668116" />
                            <stop offset="0.666667" stopOpacity="0.768225" />
                            <stop offset="0.733333" stopOpacity="0.852589" />
                            <stop offset="0.8" stopOpacity="0.91834" />
                            <stop offset="0.866667" stopOpacity="0.96449" />
                            <stop offset="0.933333" stopOpacity="0.991353" />
                            <stop offset="1" />
                        </linearGradient>
                    </defs>
                </svg>

                <H3>{t('pro_set_up_boimetry_title')}</H3>
                <Body2>{t('pro_set_up_boimetry_subtitle')}</Body2>
            </BiometricsFirstBlockWrapper>
            <SecondBlockWrapper>
                <Button primary fullWidth size="large" onClick={() => onSubmit(true)}>
                    {t('continue')}
                </Button>
            </SecondBlockWrapper>
        </FullScreenWrapper>
    );
};

const TutorialFirstBlockWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 1;

    svg {
        margin: 0 -32px;
    }

    ${H3} {
        margin-bottom: 32px;
        text-wrap: balance;
        text-align: center;
    }
`;

const TutorialScreen: FC<{ onSubmit: () => void }> = ({ onSubmit }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    return (
        <FullScreenWrapper>
            <TutorialFirstBlockWrapper>
                <H3>{t('pro_tutorial_screen_title')}</H3>
                <svg
                    width="390"
                    height="458"
                    viewBox="0 0 390 458"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M32.5 25.6C32.5 21.1113 32.5004 17.7749 32.7163 15.1319C32.9318 12.4948 33.3594 10.5922 34.1894 8.96315C35.6754 6.04664 38.0466 3.67544 40.9631 2.1894C42.5922 1.35935 44.4948 0.931787 47.1319 0.716326C49.7749 0.500389 53.1113 0.5 57.6 0.5H332.4C336.889 0.5 340.225 0.500389 342.868 0.716326C345.505 0.931787 347.408 1.35935 349.037 2.1894C351.953 3.67544 354.325 6.04664 355.811 8.96315C356.641 10.5922 357.068 12.4948 357.284 15.1319C357.5 17.7749 357.5 21.1113 357.5 25.6V300.4C357.5 304.889 357.5 308.225 357.284 310.868C357.068 313.505 356.641 315.408 355.811 317.037C354.325 319.953 351.953 322.325 349.037 323.811C347.408 324.641 345.505 325.068 342.868 325.284C340.225 325.5 336.889 325.5 332.4 325.5H57.6C53.1113 325.5 49.7749 325.5 47.1319 325.284C44.4948 325.068 42.5922 324.641 40.9631 323.811C38.0466 322.325 35.6754 319.953 34.1894 317.037C33.3594 315.408 32.9318 313.505 32.7163 310.868C32.5004 308.225 32.5 304.889 32.5 300.4V25.6Z"
                        stroke={theme.iconTertiary}
                    />
                    <rect
                        x="296"
                        y="13"
                        width="32"
                        height="8"
                        rx="4"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        width="8"
                        height="8"
                        rx="4"
                        transform="matrix(-1 0 0 1 292 13)"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        x="296"
                        y="29"
                        width="20"
                        height="8"
                        rx="4"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        x="296"
                        y="45"
                        width="36"
                        height="8"
                        rx="4"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        x="296"
                        y="61"
                        width="28"
                        height="8"
                        rx="4"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        x="296"
                        y="77"
                        width="32"
                        height="8"
                        rx="4"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        x="296"
                        y="93"
                        width="24"
                        height="8"
                        rx="4"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        width="8"
                        height="8"
                        rx="4"
                        transform="matrix(-1 0 0 1 292 29)"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        width="8"
                        height="8"
                        rx="4"
                        transform="matrix(-1 0 0 1 292 45)"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        width="8"
                        height="8"
                        rx="4"
                        transform="matrix(-1 0 0 1 292 61)"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        width="8"
                        height="8"
                        rx="4"
                        transform="matrix(-1 0 0 1 292 77)"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        width="8"
                        height="8"
                        rx="4"
                        transform="matrix(-1 0 0 1 292 93)"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        x="45"
                        y="13"
                        width="40"
                        height="8"
                        rx="4"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        x="45"
                        y="29"
                        width="28"
                        height="8"
                        rx="4"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        x="45"
                        y="45"
                        width="36"
                        height="8"
                        rx="4"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        x="45"
                        y="61"
                        width="32"
                        height="8"
                        rx="4"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        x="45"
                        y="77"
                        width="56"
                        height="8"
                        rx="4"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        x="45"
                        y="93"
                        width="28"
                        height="8"
                        rx="4"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        x="45"
                        y="109"
                        width="44"
                        height="8"
                        rx="4"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        x="45"
                        y="125"
                        width="36"
                        height="8"
                        rx="4"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        x="45"
                        y="141"
                        width="28"
                        height="8"
                        rx="4"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        x="45"
                        y="157"
                        width="40"
                        height="8"
                        rx="4"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        x="45"
                        y="173"
                        width="32"
                        height="8"
                        rx="4"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        x="57"
                        y="289"
                        width="32"
                        height="8"
                        rx="4"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        x="57"
                        y="305"
                        width="40"
                        height="8"
                        rx="4"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        width="8"
                        height="8"
                        rx="4"
                        transform="matrix(-1 0 0 1 53 289)"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        width="8"
                        height="8"
                        rx="4"
                        transform="matrix(-1 0 0 1 53 305)"
                        fill={theme.backgroundContentTint}
                    />
                    <rect x="118.5" y="0.5" width="153" height="325" stroke={theme.iconTertiary} />
                    <g clipPath="url(#clip0_56736_545803)">
                        <ellipse
                            cx="144"
                            cy="136"
                            rx="8"
                            ry="8"
                            fill={theme.backgroundContentTint}
                        />
                        <rect
                            x="158"
                            y="132"
                            width="20"
                            height="8"
                            rx="4"
                            fill={theme.backgroundContentTint}
                        />
                        <rect
                            x="224"
                            y="132"
                            width="28"
                            height="8"
                            rx="4"
                            fill={theme.backgroundContentTint}
                        />
                        <rect
                            x="129"
                            y="150"
                            width="132"
                            height="0.5"
                            fill="white"
                            fillOpacity="0.12"
                        />
                        <ellipse
                            cx="144"
                            cy="164.5"
                            rx="8"
                            ry="8"
                            fill={theme.backgroundContentTint}
                        />
                        <rect
                            x="158"
                            y="161"
                            width="28"
                            height="7"
                            rx="3.5"
                            fill={theme.backgroundContentTint}
                        />
                        <rect
                            x="232"
                            y="160.5"
                            width="20"
                            height="8"
                            rx="4"
                            fill={theme.backgroundContentTint}
                        />
                        <rect
                            x="129"
                            y="178.5"
                            width="132"
                            height="0.5"
                            fill="white"
                            fillOpacity="0.12"
                        />
                        <ellipse
                            cx="144"
                            cy="193"
                            rx="8"
                            ry="8"
                            fill={theme.backgroundContentTint}
                        />
                        <rect
                            x="158"
                            y="189"
                            width="24"
                            height="8"
                            rx="4"
                            fill={theme.backgroundContentTint}
                        />
                        <rect
                            x="228"
                            y="189"
                            width="24"
                            height="8"
                            rx="4"
                            fill={theme.backgroundContentTint}
                        />
                        <rect
                            x="129"
                            y="207"
                            width="132"
                            height="0.5"
                            fill="white"
                            fillOpacity="0.12"
                        />
                        <ellipse
                            cx="144"
                            cy="221.5"
                            rx="8"
                            ry="8"
                            fill={theme.backgroundContentTint}
                        />
                        <rect
                            x="158"
                            y="217"
                            width="40"
                            height="8"
                            rx="4"
                            fill={theme.backgroundContentTint}
                        />
                        <rect
                            x="232"
                            y="217.5"
                            width="20"
                            height="8"
                            rx="4"
                            fill={theme.backgroundContentTint}
                        />
                        <rect
                            x="129"
                            y="235.5"
                            width="132"
                            height="0.5"
                            fill="white"
                            fillOpacity="0.12"
                        />
                        <ellipse
                            cx="144"
                            cy="250"
                            rx="8"
                            ry="8"
                            fill={theme.backgroundContentTint}
                        />
                        <rect
                            x="158"
                            y="246"
                            width="28"
                            height="8"
                            rx="4"
                            fill={theme.backgroundContentTint}
                        />
                        <rect
                            x="220"
                            y="246"
                            width="32"
                            height="8"
                            rx="4"
                            fill={theme.backgroundContentTint}
                        />
                        <rect
                            x="129"
                            y="264"
                            width="132"
                            height="0.5"
                            fill="white"
                            fillOpacity="0.12"
                        />
                        <ellipse
                            cx="144"
                            cy="278.5"
                            rx="8"
                            ry="8"
                            fill={theme.backgroundContentTint}
                        />
                        <rect
                            x="158"
                            y="275"
                            width="32"
                            height="7"
                            rx="3.5"
                            fill={theme.backgroundContentTint}
                        />
                        <rect
                            x="236"
                            y="274.5"
                            width="16"
                            height="8"
                            rx="4"
                            fill={theme.backgroundContentTint}
                        />
                    </g>
                    <rect
                        x="129.5"
                        y="122.5"
                        width="131"
                        height="170"
                        rx="5.5"
                        stroke={theme.iconTertiary}
                    />
                    <path
                        d="M168.987 38.5527C168.665 38.5527 168.431 38.3379 168.431 37.9961V36.7656C166.273 36.6094 164.573 35.5449 164.105 33.9141C164.056 33.748 164.026 33.5723 164.026 33.416C164.026 32.8594 164.407 32.4785 165.003 32.4785C165.472 32.4785 165.814 32.7227 166.019 33.2402C166.341 34.1582 167.034 34.8418 168.431 34.9883V30.7305L168.03 30.6328C165.55 30.0566 164.212 28.9434 164.212 26.9609C164.212 24.7637 165.97 23.3281 168.431 23.1426V21.9023C168.431 21.5605 168.665 21.3457 168.987 21.3457C169.3 21.3457 169.534 21.5605 169.534 21.9023V23.1426C171.614 23.3086 173.196 24.4121 173.655 26.0234C173.704 26.1895 173.724 26.3457 173.724 26.5215C173.724 27.0488 173.333 27.4102 172.767 27.4102C172.259 27.4102 171.937 27.127 171.732 26.6582C171.321 25.6426 170.618 25.0566 169.534 24.9199V28.9922L170.003 29.1094C172.571 29.7051 173.978 30.7598 173.978 32.8398C173.978 35.2422 172.025 36.5898 169.534 36.7656V37.9961C169.534 38.3379 169.3 38.5527 168.987 38.5527ZM166.282 26.7949C166.282 27.6836 166.868 28.3379 168.431 28.7383V24.9199C167.025 25.0859 166.282 25.8965 166.282 26.7949ZM171.907 33.0352C171.907 32.0195 171.351 31.4238 169.534 30.9941V34.998C171.204 34.8711 171.907 34.0801 171.907 33.0352ZM179.972 37.1855C179.366 37.1855 178.966 36.8145 178.966 36.2969C178.966 36.043 179.024 35.8574 179.161 35.5938L184.825 24.8027V24.7539H178.263C177.696 24.7539 177.286 24.3926 177.286 23.8262C177.286 23.2695 177.696 22.9082 178.263 22.9082H185.733C186.554 22.9082 187.071 23.377 187.071 24.168C187.071 24.5781 186.935 24.9199 186.632 25.5156L180.958 36.5508C180.724 37.0098 180.45 37.1855 179.972 37.1855ZM189.443 37C188.779 37 188.408 36.6289 188.408 36.082C188.408 35.6523 188.535 35.418 189.014 34.9395L193.418 30.4863C195.254 28.6113 195.703 27.8887 195.703 26.7656C195.703 25.4277 194.668 24.4512 193.252 24.4512C191.865 24.4512 190.908 25.1641 190.42 26.541C190.225 26.9805 189.971 27.2441 189.434 27.2441C188.818 27.2441 188.467 26.8633 188.467 26.3164C188.467 26.1504 188.486 26.0039 188.525 25.8574C188.828 24.373 190.459 22.6445 193.262 22.6445C195.957 22.6445 197.861 24.3047 197.861 26.6289C197.861 28.2305 197.109 29.3633 194.736 31.7363L191.377 35.1055V35.1543H197.227C197.822 35.1543 198.193 35.5254 198.193 36.082C198.193 36.6289 197.822 37 197.227 37H189.443ZM201.103 37.1074C200.39 37.1074 199.823 36.541 199.823 35.8281C199.823 35.1152 200.39 34.5488 201.103 34.5488C201.815 34.5488 202.382 35.1152 202.382 35.8281C202.382 36.541 201.815 37.1074 201.103 37.1074ZM209.168 37.2637C206.853 37.2637 205.281 36.3652 204.5 34.9395C204.305 34.5781 204.217 34.2363 204.217 33.8848C204.217 33.2988 204.588 32.918 205.203 32.918C205.672 32.918 205.945 33.1328 206.17 33.6406C206.648 34.7637 207.566 35.4375 209.178 35.4375C210.887 35.4375 212.039 34.4609 212.049 33.0938C212.059 31.4824 210.896 30.584 209.012 30.584H208.074C207.518 30.584 207.166 30.2422 207.166 29.7344C207.166 29.2266 207.518 28.8848 208.074 28.8848H208.953C210.564 28.8848 211.658 27.9277 211.658 26.6191C211.658 25.3105 210.818 24.4414 209.148 24.4414C207.723 24.4414 206.922 25.0371 206.434 26.209C206.199 26.7754 205.965 26.9805 205.447 26.9805C204.832 26.9805 204.5 26.6289 204.5 26.043C204.5 25.6621 204.578 25.3398 204.764 24.9785C205.467 23.582 207 22.6445 209.148 22.6445C212.019 22.6445 213.787 24.2168 213.787 26.3164C213.787 28.0742 212.547 29.2656 210.818 29.627V29.6758C212.889 29.8613 214.275 31.1211 214.275 33.0938C214.275 35.5742 212.107 37.2637 209.168 37.2637ZM223.64 37.1855C223.034 37.1855 222.595 36.7656 222.595 36.0918V34.1973H216.794C216.013 34.1973 215.515 33.709 215.515 32.957C215.515 32.459 215.632 32.0684 216.003 31.4238C216.999 29.6367 218.747 27.0195 220.563 24.3828C221.423 23.1133 221.979 22.7227 222.897 22.7227C224.04 22.7227 224.694 23.3184 224.694 24.373V32.3613H225.808C226.384 32.3613 226.765 32.7324 226.765 33.2793C226.765 33.8262 226.384 34.1973 225.808 34.1973H224.694V36.0918C224.694 36.7656 224.255 37.1855 223.64 37.1855ZM222.614 32.3906V24.6562H222.575C220.183 28.084 218.708 30.291 217.565 32.332V32.3906H222.614Z"
                        fill={theme.iconSecondary}
                    />
                    <mask id="path-62-inside-1_56736_545803" fill="white">
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M151 57.5703C151.189 57.5703 151.371 57.6456 151.505 57.7795L155.791 62.0652C156.07 62.3442 156.07 62.7964 155.791 63.0754C155.512 63.3543 155.06 63.3543 154.781 63.0754L151.714 60.009V69.7132C151.714 70.1077 151.394 70.4275 151 70.4275C150.606 70.4275 150.286 70.1077 150.286 69.7132V60.009L147.219 63.0754C146.94 63.3543 146.488 63.3543 146.209 63.0754C145.93 62.7964 145.93 62.3442 146.209 62.0652L150.495 57.7795C150.629 57.6456 150.811 57.5703 151 57.5703Z"
                        />
                    </mask>
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M151 57.5703C151.189 57.5703 151.371 57.6456 151.505 57.7795L155.791 62.0652C156.07 62.3442 156.07 62.7964 155.791 63.0754C155.512 63.3543 155.06 63.3543 154.781 63.0754L151.714 60.009V69.7132C151.714 70.1077 151.394 70.4275 151 70.4275C150.606 70.4275 150.286 70.1077 150.286 69.7132V60.009L147.219 63.0754C146.94 63.3543 146.488 63.3543 146.209 63.0754C145.93 62.7964 145.93 62.3442 146.209 62.0652L150.495 57.7795C150.629 57.6456 150.811 57.5703 151 57.5703Z"
                        fill={theme.iconSecondary}
                    />
                    <path
                        d="M151.505 57.7795L152.01 57.2744L152.01 57.2744L151.505 57.7795ZM155.791 62.0652L155.286 62.5703L155.791 62.0652ZM154.781 63.0754L154.276 63.5805L154.781 63.0754ZM151.714 60.009L152.219 59.504L151 58.2846V60.009H151.714ZM150.286 60.009H151V58.2846L149.781 59.504L150.286 60.009ZM147.219 63.0754L146.714 62.5703L147.219 63.0754ZM146.209 63.0754L145.704 63.5805L145.704 63.5805L146.209 63.0754ZM146.209 62.0652L146.714 62.5703L146.209 62.0652ZM150.495 57.7795L149.99 57.2744V57.2744L150.495 57.7795ZM152.01 57.2744C151.742 57.0065 151.379 56.856 151 56.856V58.2846L151 58.2846L152.01 57.2744ZM156.296 61.5602L152.01 57.2744L151 58.2846L155.286 62.5703L156.296 61.5602ZM156.296 63.5805C156.854 63.0226 156.854 62.1181 156.296 61.5602L155.286 62.5703L156.296 63.5805ZM154.276 63.5805C154.833 64.1384 155.738 64.1384 156.296 63.5805L155.286 62.5703L154.276 63.5805ZM151.209 60.5141L154.276 63.5805L155.286 62.5703L152.219 59.504L151.209 60.5141ZM152.429 69.7132V60.009H151V69.7132H152.429ZM151 71.1417C151.789 71.1417 152.429 70.5021 152.429 69.7132H151V71.1417ZM149.571 69.7132C149.571 70.5021 150.211 71.1417 151 71.1417V69.7132H149.571ZM149.571 60.009V69.7132H151V60.009H149.571ZM147.724 63.5805L150.791 60.5141L149.781 59.504L146.714 62.5703L147.724 63.5805ZM145.704 63.5805C146.262 64.1384 147.167 64.1384 147.724 63.5805L146.714 62.5703H146.714L145.704 63.5805ZM145.704 61.5602C145.146 62.1181 145.146 63.0226 145.704 63.5805L146.714 62.5703L145.704 61.5602ZM149.99 57.2744L145.704 61.5602L146.714 62.5703L151 58.2846L149.99 57.2744ZM151 56.856C150.621 56.856 150.258 57.0065 149.99 57.2744L151 58.2846H151V56.856Z"
                        fill={theme.iconSecondary}
                        mask="url(#path-62-inside-1_56736_545803)"
                    />
                    <mask id="path-64-inside-2_56736_545803" fill="white">
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M195 70.4275C195.189 70.4275 195.371 70.3522 195.505 70.2182L199.791 65.9325C200.07 65.6536 200.07 65.2013 199.791 64.9224C199.512 64.6434 199.06 64.6434 198.781 64.9224L195.714 67.9887V58.2846C195.714 57.8901 195.394 57.5703 195 57.5703C194.606 57.5703 194.286 57.8901 194.286 58.2846V67.9887L191.219 64.9224C190.94 64.6434 190.488 64.6434 190.209 64.9224C189.93 65.2013 189.93 65.6536 190.209 65.9325L194.495 70.2182C194.629 70.3522 194.811 70.4275 195 70.4275Z"
                        />
                    </mask>
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M195 70.4275C195.189 70.4275 195.371 70.3522 195.505 70.2182L199.791 65.9325C200.07 65.6536 200.07 65.2013 199.791 64.9224C199.512 64.6434 199.06 64.6434 198.781 64.9224L195.714 67.9887V58.2846C195.714 57.8901 195.394 57.5703 195 57.5703C194.606 57.5703 194.286 57.8901 194.286 58.2846V67.9887L191.219 64.9224C190.94 64.6434 190.488 64.6434 190.209 64.9224C189.93 65.2013 189.93 65.6536 190.209 65.9325L194.495 70.2182C194.629 70.3522 194.811 70.4275 195 70.4275Z"
                        fill={theme.iconSecondary}
                    />
                    <path
                        d="M195.505 70.2182L196.01 70.7233L196.01 70.7233L195.505 70.2182ZM199.791 65.9325L199.286 65.4275L199.791 65.9325ZM198.781 64.9224L198.276 64.4173L198.781 64.9224ZM195.714 67.9887H195V69.7132L196.219 68.4938L195.714 67.9887ZM194.286 67.9887L193.781 68.4938L195 69.7132V67.9887H194.286ZM191.219 64.9224L190.714 65.4275L191.219 64.9224ZM190.209 64.9224L189.704 64.4173H189.704L190.209 64.9224ZM190.209 65.9325L190.714 65.4275L190.209 65.9325ZM194.495 70.2182L193.99 70.7233L194.495 70.2182ZM195 69.7132L195 69.7132V71.1417C195.379 71.1417 195.742 70.9912 196.01 70.7233L195 69.7132ZM199.286 65.4275L195 69.7132L196.01 70.7233L200.296 66.4376L199.286 65.4275ZM199.286 65.4275V65.4275L200.296 66.4376C200.854 65.8797 200.854 64.9752 200.296 64.4173L199.286 65.4275ZM199.286 65.4275L200.296 64.4173C199.738 63.8594 198.833 63.8594 198.276 64.4173L199.286 65.4275ZM196.219 68.4938L199.286 65.4275L198.276 64.4173L195.209 67.4837L196.219 68.4938ZM195 58.2846V67.9887H196.429V58.2846H195ZM195 58.2846V58.2846H196.429C196.429 57.4956 195.789 56.856 195 56.856V58.2846ZM195 58.2846V58.2846V56.856C194.211 56.856 193.571 57.4956 193.571 58.2846H195ZM195 67.9887V58.2846H193.571V67.9887H195ZM190.714 65.4275L193.781 68.4938L194.791 67.4837L191.724 64.4173L190.714 65.4275ZM190.714 65.4275H190.714L191.724 64.4173C191.167 63.8594 190.262 63.8594 189.704 64.4173L190.714 65.4275ZM190.714 65.4275V65.4275L189.704 64.4173C189.146 64.9752 189.146 65.8797 189.704 66.4376L190.714 65.4275ZM195 69.7132L190.714 65.4275L189.704 66.4376L193.99 70.7233L195 69.7132ZM195 69.7132H195L193.99 70.7233C194.258 70.9912 194.621 71.1417 195 71.1417V69.7132Z"
                        fill={theme.iconSecondary}
                        mask="url(#path-64-inside-2_56736_545803)"
                    />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M232.574 61.4983C232.968 61.4983 233.288 61.1787 233.288 60.7843H233.291V60.5698C233.291 59.7697 233.291 59.3696 233.447 59.0641C233.584 58.7953 233.803 58.5767 234.071 58.4397C234.377 58.284 234.777 58.284 235.577 58.284H235.762C235.772 58.2844 235.781 58.2846 235.791 58.2846C236.185 58.2846 236.505 57.9648 236.505 57.5703C236.505 57.1758 236.185 56.856 235.791 56.856C235.782 56.856 235.773 56.8562 235.764 56.8565C234.597 56.8625 233.942 56.9024 233.423 57.1669C232.885 57.4408 232.448 57.8779 232.174 58.4155C231.914 58.9264 231.871 59.5694 231.864 60.7015C231.861 60.7286 231.859 60.7561 231.859 60.784C231.859 61.1785 232.179 61.4983 232.574 61.4983ZM244.717 67.2126C244.717 67.2361 244.718 67.2593 244.72 67.2822V67.4269C244.72 68.227 244.72 68.627 244.564 68.9326C244.427 69.2014 244.209 69.4199 243.94 69.5569C243.634 69.7126 243.234 69.7126 242.434 69.7126H242.218V69.7132C241.824 69.7138 241.505 70.0333 241.505 70.4275C241.505 70.8219 241.825 71.1417 242.219 71.1417C242.236 71.1417 242.253 71.1412 242.27 71.14C243.422 71.1336 244.073 71.0926 244.588 70.8298C245.126 70.5559 245.563 70.1188 245.837 69.5812C246.148 68.97 246.148 68.1699 246.148 66.5698V61.4269C246.148 59.8267 246.148 59.0267 245.837 58.4155C245.563 57.8779 245.126 57.4408 244.588 57.1669C244.069 56.9023 243.413 56.8625 242.246 56.8565C242.237 56.8562 242.228 56.856 242.219 56.856C241.825 56.856 241.505 57.1758 241.505 57.5703C241.505 57.9648 241.825 58.2846 242.219 58.2846C242.229 58.2846 242.238 58.2844 242.248 58.284H242.434C243.234 58.284 243.634 58.284 243.94 58.4397C244.209 58.5767 244.427 58.7953 244.564 59.0641C244.72 59.3696 244.72 59.7697 244.72 60.5698V60.7144C244.718 60.7373 244.717 60.7606 244.717 60.784C244.717 61.1785 245.036 61.4983 245.431 61.4983C245.825 61.4983 246.145 61.1787 246.145 60.7843H246.147V67.2129H246.145V67.2126C246.145 66.8181 245.825 66.4983 245.431 66.4983C245.036 66.4983 244.717 66.8181 244.717 67.2126ZM233.291 67.2129H233.288V67.2126C233.288 66.8181 232.968 66.4983 232.574 66.4983C232.179 66.4983 231.859 66.8181 231.859 67.2126C231.859 67.2405 231.861 67.2681 231.864 67.2952C231.871 68.4273 231.914 69.0702 232.174 69.5812C232.448 70.1188 232.885 70.5559 233.423 70.8298C233.938 71.0925 234.589 71.1336 235.74 71.14C235.757 71.1412 235.774 71.1417 235.791 71.1417C236.185 71.1417 236.505 70.8219 236.505 70.4275C236.505 70.033 236.185 69.7132 235.791 69.7132H235.79V69.7126H235.577C234.777 69.7126 234.377 69.7126 234.071 69.5569C233.803 69.4199 233.584 69.2014 233.447 68.9326C233.291 68.627 233.291 68.227 233.291 67.4269V67.2129ZM241.577 56.8555C241.731 56.8555 241.878 56.8555 242.018 56.8557H235.993C236.133 56.8555 236.28 56.8555 236.434 56.8555H241.577ZM235.429 63.2854C235.035 63.2854 234.715 63.6052 234.715 63.9997C234.715 64.3942 235.035 64.714 235.429 64.714H242.572C242.966 64.714 243.286 64.3942 243.286 63.9997C243.286 63.6052 242.966 63.2854 242.572 63.2854H235.429Z"
                        fill={theme.iconSecondary}
                    />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M146.206 89.7795C146.485 89.5006 146.938 89.5006 147.217 89.7795L150.788 93.351C151.067 93.6299 151.067 94.0822 150.788 94.3611C150.509 94.64 150.057 94.64 149.778 94.3611L147.426 92.009V99.5703C147.426 99.9648 147.106 100.285 146.711 100.285C146.317 100.285 145.997 99.9648 145.997 99.5703V92.009L143.645 94.3611C143.366 94.64 142.914 94.64 142.635 94.3611C142.356 94.0822 142.356 93.6299 142.635 93.351L146.206 89.7795ZM154.778 102.218C154.912 102.352 155.093 102.427 155.283 102.427C155.472 102.427 155.654 102.352 155.788 102.218L159.359 98.6468C159.638 98.3679 159.638 97.9156 159.359 97.6367C159.08 97.3577 158.628 97.3577 158.349 97.6367L155.997 99.9887V92.4275C155.997 92.033 155.677 91.7132 155.283 91.7132C154.888 91.7132 154.569 92.033 154.569 92.4275V99.9887L152.217 97.6367C151.938 97.3577 151.485 97.3577 151.206 97.6367C150.927 97.9156 150.927 98.3679 151.206 98.6468L154.778 102.218Z"
                        fill={theme.iconSecondary}
                    />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M190.15 89.7795C189.871 89.5006 189.419 89.5006 189.14 89.7795L185.569 93.351C185.29 93.6299 185.29 94.0822 185.569 94.3611C185.848 94.64 186.3 94.64 186.579 94.3611L188.931 92.009V101.713C188.931 102.108 189.251 102.427 189.645 102.427C190.04 102.427 190.359 102.108 190.359 101.713V92.009L192.711 94.3611C192.99 94.64 193.443 94.64 193.722 94.3611C194.001 94.0822 194.001 93.6299 193.722 93.351L190.15 89.7795ZM200.864 89.7795C200.586 89.5006 200.133 89.5006 199.854 89.7795L196.283 93.351C196.004 93.6299 196.004 94.0822 196.283 94.3611C196.562 94.64 197.014 94.64 197.293 94.3611L199.645 92.009V101.713C199.645 102.108 199.965 102.427 200.359 102.427C200.754 102.427 201.074 102.108 201.074 101.713V92.009L203.426 94.3611C203.705 94.64 204.157 94.64 204.436 94.3611C204.715 94.0822 204.715 93.6299 204.436 93.351L200.864 89.7795Z"
                        fill={theme.iconSecondary}
                    />
                    <path
                        d="M238.999 101.714V95.9994M238.999 95.9994V90.2852M238.999 95.9994H244.714M238.999 95.9994H233.285"
                        stroke={theme.iconSecondary}
                        strokeWidth="1.42857"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <g clipPath="url(#clip1_56736_545803)">
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M130.327 303.638C130 304.28 130 305.12 130 306.8V311.2C130 312.88 130 313.72 130.327 314.362C130.615 314.926 131.074 315.385 131.638 315.673C132.28 316 133.12 316 134.8 316H141.2C142.88 316 143.72 316 144.362 315.673C144.926 315.385 145.385 314.926 145.673 314.362C146 313.72 146 312.88 146 311.2V306.8C146 305.12 146 304.28 145.673 303.638C145.385 303.074 144.926 302.615 144.362 302.327C143.72 302 142.88 302 141.2 302H134.8C133.12 302 132.28 302 131.638 302.327C131.074 302.615 130.615 303.074 130.327 303.638ZM131.218 304.092C131 304.52 131 305.08 131 306.2V311.8C131 312.92 131 313.48 131.218 313.908C131.41 314.284 131.716 314.59 132.092 314.782C132.52 315 133.08 315 134.2 315H141.8C142.92 315 143.48 315 143.908 314.782C144.284 314.59 144.59 314.284 144.782 313.908C145 313.48 145 312.92 145 311.8V306.2C145 305.08 145 304.52 144.782 304.092C144.59 303.716 144.284 303.41 143.908 303.218C143.48 303 142.92 303 141.8 303H134.2C133.08 303 132.52 303 132.092 303.218C131.716 303.41 131.41 303.716 131.218 304.092Z"
                            fill={theme.iconPrimary}
                        />
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M134.8 303H136V315H134.8C133.943 315 133.361 314.999 132.911 314.962C132.473 314.927 132.248 314.862 132.092 314.782C131.716 314.59 131.41 314.284 131.218 313.908C131.138 313.752 131.073 313.527 131.038 313.089C131.001 312.639 131 312.057 131 311.2V306.8C131 305.943 131.001 305.361 131.038 304.911C131.073 304.473 131.138 304.248 131.218 304.092C131.41 303.716 131.716 303.41 132.092 303.218C132.248 303.138 132.473 303.073 132.911 303.038C133.361 303.001 133.943 303 134.8 303ZM130 306.8C130 305.12 130 304.28 130.327 303.638C130.615 303.074 131.074 302.615 131.638 302.327C132.28 302 133.12 302 134.8 302H136H137V303V315V316H136H134.8C133.12 316 132.28 316 131.638 315.673C131.074 315.385 130.615 314.926 130.327 314.362C130 313.72 130 312.88 130 311.2V306.8ZM133 305C132.724 305 132.5 304.776 132.5 304.5C132.5 304.224 132.724 304 133 304H134.5C134.776 304 135 304.224 135 304.5C135 304.776 134.776 305 134.5 305H133ZM132.5 307C132.224 307 132 306.776 132 306.5C132 306.224 132.224 306 132.5 306H134.5C134.776 306 135 306.224 135 306.5C135 306.776 134.776 307 134.5 307H132.5ZM132 308.5C132 308.776 132.224 309 132.5 309H134.5C134.776 309 135 308.776 135 308.5C135 308.224 134.776 308 134.5 308H132.5C132.224 308 132 308.224 132 308.5Z"
                            fill={theme.iconPrimary}
                        />
                    </g>
                    <g clipPath="url(#clip2_56736_545803)">
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M259.673 303.638C260 304.28 260 305.12 260 306.8V311.2C260 312.88 260 313.72 259.673 314.362C259.385 314.926 258.926 315.385 258.362 315.673C257.72 316 256.88 316 255.2 316H248.8C247.12 316 246.28 316 245.638 315.673C245.074 315.385 244.615 314.926 244.327 314.362C244 313.72 244 312.88 244 311.2V306.8C244 305.12 244 304.28 244.327 303.638C244.615 303.074 245.074 302.615 245.638 302.327C246.28 302 247.12 302 248.8 302H255.2C256.88 302 257.72 302 258.362 302.327C258.926 302.615 259.385 303.074 259.673 303.638ZM258.782 304.092C259 304.52 259 305.08 259 306.2V311.8C259 312.92 259 313.48 258.782 313.908C258.59 314.284 258.284 314.59 257.908 314.782C257.48 315 256.92 315 255.8 315H248.2C247.08 315 246.52 315 246.092 314.782C245.716 314.59 245.41 314.284 245.218 313.908C245 313.48 245 312.92 245 311.8V306.2C245 305.08 245 304.52 245.218 304.092C245.41 303.716 245.716 303.41 246.092 303.218C246.52 303 247.08 303 248.2 303H255.8C256.92 303 257.48 303 257.908 303.218C258.284 303.41 258.59 303.716 258.782 304.092Z"
                            fill={theme.iconPrimary}
                        />
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M255.2 303H254V315H255.2C256.057 315 256.639 314.999 257.089 314.962C257.527 314.927 257.752 314.862 257.908 314.782C258.284 314.59 258.59 314.284 258.782 313.908C258.862 313.752 258.927 313.527 258.962 313.089C258.999 312.639 259 312.057 259 311.2V306.8C259 305.943 258.999 305.361 258.962 304.911C258.927 304.473 258.862 304.248 258.782 304.092C258.59 303.716 258.284 303.41 257.908 303.218C257.752 303.138 257.527 303.073 257.089 303.038C256.639 303.001 256.057 303 255.2 303ZM260 306.8C260 305.12 260 304.28 259.673 303.638C259.385 303.074 258.926 302.615 258.362 302.327C257.72 302 256.88 302 255.2 302H254H253V303V315V316H254H255.2C256.88 316 257.72 316 258.362 315.673C258.926 315.385 259.385 314.926 259.673 314.362C260 313.72 260 312.88 260 311.2V306.8ZM257 305C257.276 305 257.5 304.776 257.5 304.5C257.5 304.224 257.276 304 257 304H255.5C255.224 304 255 304.224 255 304.5C255 304.776 255.224 305 255.5 305H257ZM257.5 307C257.776 307 258 306.776 258 306.5C258 306.224 257.776 306 257.5 306H255.5C255.224 306 255 306.224 255 306.5C255 306.776 255.224 307 255.5 307H257.5ZM258 308.5C258 308.776 257.776 309 257.5 309H255.5C255.224 309 255 308.776 255 308.5C255 308.224 255.224 308 255.5 308H257.5C257.776 308 258 308.224 258 308.5Z"
                            fill={theme.iconPrimary}
                        />
                    </g>
                    <rect
                        x="175"
                        y="303"
                        width="40"
                        height="12"
                        rx="6"
                        fill={theme.backgroundContentTint}
                    />
                    <rect
                        x="119"
                        y="301"
                        width="1"
                        height="32"
                        transform="rotate(180 119 301)"
                        fill="url(#paint0_linear_56736_545803)"
                    />
                    <rect x="118" y="301" width="1" height="24" fill="black" />
                    <rect
                        x="272"
                        y="301"
                        width="1"
                        height="32"
                        transform="rotate(180 272 301)"
                        fill="url(#paint1_linear_56736_545803)"
                    />
                    <rect x="271" y="301" width="1" height="24" fill="black" />
                    <path d="M75 350L75 382" stroke={theme.iconTertiary} strokeLinecap="round" />
                    <path d="M315 350L315 382" stroke={theme.iconTertiary} strokeLinecap="round" />
                    <path d="M195 350L195 382" stroke={theme.iconTertiary} strokeLinecap="round" />
                    <path
                        d="M47.2195 417L44.5603 407.136H46.1599L47.9715 414.799H48.0603L50.118 407.136H51.5467L53.618 414.799H53.7068L55.5115 407.136H57.1043L54.4451 417H52.9959L50.8767 409.631H50.7879L48.6687 417H47.2195ZM59.9171 417.123C59.4477 417.123 59.0261 417.034 58.6524 416.856C58.2833 416.674 57.9916 416.417 57.7774 416.084C57.5632 415.751 57.4561 415.362 57.4561 414.915V414.901C57.4561 414.455 57.5632 414.074 57.7774 413.76C57.9962 413.445 58.3106 413.199 58.7208 413.021C59.1355 412.839 59.6368 412.73 60.2247 412.693L62.9659 412.529V413.575L60.4298 413.739C59.9194 413.771 59.5434 413.881 59.3018 414.067C59.0603 414.25 58.9395 414.507 58.9395 414.84V414.854C58.9395 415.191 59.0694 415.457 59.3292 415.653C59.589 415.845 59.9171 415.94 60.3136 415.94C60.6827 415.94 61.0108 415.868 61.2979 415.722C61.5896 415.571 61.8175 415.371 61.9815 415.12C62.1456 414.865 62.2276 414.578 62.2276 414.259V411.921C62.2276 411.511 62.1 411.199 61.8448 410.984C61.5942 410.766 61.2205 410.656 60.7237 410.656C60.309 410.656 59.9695 410.729 59.7052 410.875C59.4454 411.021 59.2722 411.226 59.1856 411.49L59.172 411.511H57.7432L57.7501 411.463C57.8093 411.053 57.9711 410.697 58.2354 410.396C58.5043 410.091 58.8552 409.854 59.2882 409.686C59.7257 409.517 60.2247 409.433 60.7852 409.433C61.4096 409.433 61.9382 409.533 62.3712 409.733C62.8087 409.929 63.1391 410.214 63.3624 410.588C63.5903 410.957 63.7042 411.401 63.7042 411.921V417H62.2276V415.947H62.1182C61.9724 416.198 61.7901 416.412 61.5714 416.59C61.3526 416.763 61.1043 416.895 60.8263 416.986C60.5483 417.077 60.2452 417.123 59.9171 417.123ZM65.7103 417V406.664H67.1937V417H65.7103ZM69.3161 417V406.664H70.7995V417H69.3161ZM75.9707 417.144C75.2461 417.144 74.624 416.989 74.1045 416.679C73.585 416.364 73.1839 415.92 72.9014 415.346C72.6234 414.771 72.4844 414.092 72.4844 413.309V413.302C72.4844 412.527 72.6234 411.85 72.9014 411.271C73.1839 410.693 73.5804 410.242 74.0908 409.918C74.6058 409.594 75.2074 409.433 75.8955 409.433C76.5882 409.433 77.1829 409.588 77.6797 409.897C78.181 410.207 78.5661 410.643 78.835 411.203C79.1038 411.759 79.2383 412.411 79.2383 413.158V413.678H73.2363V412.618H78.5L77.7891 413.603V413.008C77.7891 412.479 77.707 412.042 77.543 411.695C77.3835 411.344 77.1624 411.082 76.8799 410.909C76.5973 410.736 76.2715 410.649 75.9023 410.649C75.5332 410.649 75.2028 410.741 74.9111 410.923C74.624 411.101 74.3962 411.365 74.2275 411.716C74.0635 412.067 73.9814 412.497 73.9814 413.008V413.603C73.9814 414.09 74.0635 414.507 74.2275 414.854C74.3916 415.2 74.624 415.464 74.9248 415.646C75.2301 415.829 75.5902 415.92 76.0049 415.92C76.3239 415.92 76.5973 415.877 76.8252 415.79C77.0576 415.699 77.2467 415.587 77.3926 415.455C77.543 415.323 77.6455 415.193 77.7002 415.065L77.7275 415.011H79.1631L79.1494 415.072C79.0856 415.318 78.974 415.564 78.8145 415.811C78.6549 416.052 78.443 416.273 78.1787 416.474C77.9189 416.674 77.6045 416.836 77.2354 416.959C76.8708 417.082 76.4492 417.144 75.9707 417.144ZM83.6507 417.048C82.8395 417.048 82.2516 416.893 81.887 416.583C81.527 416.269 81.347 415.756 81.347 415.045V410.745H80.1849V409.576H81.347V407.703H82.8646V409.576H84.4573V410.745H82.8646V414.683C82.8646 415.084 82.9443 415.373 83.1038 415.551C83.2633 415.724 83.5276 415.811 83.8968 415.811C84.0062 415.811 84.0996 415.808 84.1771 415.804C84.2591 415.799 84.3525 415.792 84.4573 415.783V416.973C84.3388 416.991 84.2112 417.007 84.0745 417.021C83.9378 417.039 83.7965 417.048 83.6507 417.048ZM88.6305 417.144C88.0335 417.144 87.5139 417.057 87.0719 416.884C86.6298 416.706 86.2789 416.462 86.0191 416.152C85.7594 415.838 85.6067 415.473 85.5611 415.059V415.045H87.0514V415.059C87.1471 415.337 87.3294 415.562 87.5983 415.735C87.8671 415.909 88.2226 415.995 88.6647 415.995C88.97 415.995 89.2366 415.952 89.4645 415.865C89.6969 415.779 89.8792 415.658 90.0113 415.503C90.1435 415.348 90.2096 415.17 90.2096 414.97V414.956C90.2096 414.724 90.1162 414.528 89.9293 414.368C89.7425 414.209 89.4348 414.079 89.0065 413.979L87.817 413.705C87.3522 413.6 86.9671 413.457 86.6617 413.274C86.3564 413.092 86.1308 412.869 85.985 412.604C85.8391 412.336 85.7662 412.021 85.7662 411.661V411.654C85.7662 411.221 85.8893 410.839 86.1354 410.506C86.3815 410.169 86.721 409.907 87.1539 409.72C87.5914 409.528 88.0904 409.433 88.651 409.433C89.2161 409.433 89.7083 409.521 90.1275 409.699C90.5514 409.872 90.8863 410.114 91.1324 410.424C91.3785 410.729 91.5244 411.085 91.5699 411.49V411.497H90.1481V411.483C90.0797 411.224 89.9156 411.007 89.6559 410.834C89.4007 410.661 89.0634 410.574 88.6441 410.574C88.3753 410.574 88.136 410.618 87.9264 410.704C87.7167 410.786 87.5504 410.902 87.4274 411.053C87.3089 411.199 87.2496 411.372 87.2496 411.572V411.586C87.2496 411.741 87.2884 411.878 87.3658 411.996C87.4479 412.11 87.5755 412.213 87.7486 412.304C87.9218 412.39 88.1451 412.468 88.4186 412.536L89.6012 412.803C90.3121 412.971 90.8408 413.215 91.1871 413.534C91.538 413.853 91.7135 414.282 91.7135 414.819V414.833C91.7135 415.289 91.579 415.692 91.3102 416.043C91.0413 416.389 90.6744 416.66 90.2096 416.856C89.7493 417.048 89.2229 417.144 88.6305 417.144ZM104.066 417L99.1438 411.613C98.7974 411.24 98.524 410.914 98.3235 410.636C98.1229 410.358 97.9794 410.105 97.8928 409.877C97.8062 409.645 97.7629 409.412 97.7629 409.18V409.166C97.7629 408.733 97.8768 408.348 98.1047 408.011C98.3326 407.674 98.6447 407.409 99.0412 407.218C99.4377 407.026 99.8866 406.931 100.388 406.931C100.894 406.931 101.343 407.026 101.735 407.218C102.127 407.409 102.434 407.674 102.657 408.011C102.881 408.343 102.992 408.726 102.992 409.159V409.173C102.992 409.506 102.917 409.82 102.767 410.116C102.621 410.412 102.382 410.7 102.049 410.978C101.716 411.256 101.274 411.538 100.723 411.825L99.9641 411.039C100.392 410.82 100.727 410.618 100.969 410.431C101.215 410.239 101.391 410.05 101.495 409.863C101.6 409.672 101.653 409.465 101.653 409.241V409.228C101.653 408.991 101.598 408.783 101.488 408.605C101.384 408.428 101.238 408.289 101.051 408.188C100.864 408.088 100.645 408.038 100.395 408.038C100.153 408.038 99.9367 408.088 99.7453 408.188C99.5585 408.289 99.4104 408.43 99.301 408.612C99.1916 408.79 99.1369 408.997 99.1369 409.234V409.248C99.1369 409.412 99.1734 409.576 99.2463 409.74C99.3192 409.904 99.4377 410.091 99.6018 410.301C99.7658 410.506 99.9914 410.763 100.279 411.073L105.857 416.993V417H104.066ZM100.06 417.185C99.3899 417.185 98.7997 417.068 98.2893 416.836C97.7834 416.599 97.3892 416.271 97.1067 415.852C96.8241 415.428 96.6828 414.942 96.6828 414.396V414.382C96.6828 413.794 96.8401 413.277 97.1545 412.83C97.4735 412.383 97.9612 411.994 98.6174 411.661L99.1848 411.374L99.9641 412.229L99.4651 412.475C99.0367 412.684 98.7085 412.942 98.4807 413.247C98.2574 413.552 98.1457 413.892 98.1457 414.266V414.279C98.1457 414.617 98.2323 414.915 98.4055 415.175C98.5787 415.435 98.8202 415.637 99.1301 415.783C99.44 415.924 99.7977 415.995 100.203 415.995C100.595 415.995 100.951 415.943 101.27 415.838C101.589 415.733 101.874 415.583 102.124 415.387C102.375 415.191 102.594 414.963 102.78 414.703C103.049 414.316 103.25 413.869 103.382 413.363C103.514 412.857 103.58 412.313 103.58 411.729V411.504H104.927V411.784C104.927 412.568 104.824 413.29 104.619 413.951C104.414 414.612 104.102 415.188 103.683 415.681C103.277 416.15 102.774 416.519 102.172 416.788C101.571 417.052 100.866 417.185 100.06 417.185ZM40.0896 437V427.136H43.6512C44.631 427.136 45.4672 427.329 46.1599 427.717C46.8527 428.104 47.3813 428.662 47.7459 429.392C48.115 430.121 48.2996 431.003 48.2996 432.037V432.051C48.2996 433.094 48.115 433.985 47.7459 434.724C47.3813 435.462 46.8527 436.027 46.1599 436.419C45.4718 436.806 44.6355 437 43.6512 437H40.0896ZM41.6209 435.674H43.4803C44.1684 435.674 44.754 435.533 45.2371 435.25C45.7247 434.967 46.0939 434.557 46.3445 434.02C46.5997 433.482 46.7273 432.832 46.7273 432.071V432.058C46.7273 431.301 46.5974 430.654 46.3377 430.116C46.0825 429.578 45.7133 429.168 45.2303 428.886C44.7472 428.603 44.1639 428.462 43.4803 428.462H41.6209V435.674ZM52.0558 437.123C51.5864 437.123 51.1648 437.034 50.7911 436.856C50.422 436.674 50.1303 436.417 49.9161 436.084C49.7019 435.751 49.5948 435.362 49.5948 434.915V434.901C49.5948 434.455 49.7019 434.074 49.9161 433.76C50.1349 433.445 50.4493 433.199 50.8595 433.021C51.2742 432.839 51.7755 432.73 52.3634 432.693L55.1046 432.529V433.575L52.5684 433.739C52.058 433.771 51.6821 433.881 51.4405 434.067C51.199 434.25 51.0782 434.507 51.0782 434.84V434.854C51.0782 435.191 51.2081 435.457 51.4679 435.653C51.7276 435.845 52.0558 435.94 52.4522 435.94C52.8214 435.94 53.1495 435.868 53.4366 435.722C53.7283 435.571 53.9561 435.371 54.1202 435.12C54.2843 434.865 54.3663 434.578 54.3663 434.259V431.921C54.3663 431.511 54.2387 431.199 53.9835 430.984C53.7328 430.766 53.3591 430.656 52.8624 430.656C52.4477 430.656 52.1082 430.729 51.8438 430.875C51.5841 431.021 51.4109 431.226 51.3243 431.49L51.3106 431.511H49.8819L49.8888 431.463C49.948 431.053 50.1098 430.697 50.3741 430.396C50.643 430.091 50.9939 429.854 51.4268 429.686C51.8643 429.517 52.3634 429.433 52.9239 429.433C53.5483 429.433 54.0769 429.533 54.5099 429.733C54.9474 429.929 55.2778 430.214 55.5011 430.588C55.7289 430.957 55.8429 431.401 55.8429 431.921V437H54.3663V435.947H54.2569C54.1111 436.198 53.9288 436.412 53.71 436.59C53.4913 436.763 53.2429 436.895 52.9649 436.986C52.6869 437.077 52.3839 437.123 52.0558 437.123ZM60.4809 437.144C59.8838 437.144 59.3643 437.057 58.9223 436.884C58.4802 436.706 58.1293 436.462 57.8695 436.152C57.6098 435.838 57.4571 435.473 57.4115 435.059V435.045H58.9018V435.059C58.9975 435.337 59.1797 435.562 59.4486 435.735C59.7175 435.909 60.073 435.995 60.515 435.995C60.8204 435.995 61.087 435.952 61.3148 435.865C61.5473 435.779 61.7296 435.658 61.8617 435.503C61.9939 435.348 62.06 435.17 62.06 434.97V434.956C62.06 434.724 61.9665 434.528 61.7797 434.368C61.5928 434.209 61.2852 434.079 60.8568 433.979L59.6674 433.705C59.2025 433.6 58.8174 433.457 58.5121 433.274C58.2068 433.092 57.9812 432.869 57.8353 432.604C57.6895 432.336 57.6166 432.021 57.6166 431.661V431.654C57.6166 431.221 57.7396 430.839 57.9857 430.506C58.2318 430.169 58.5713 429.907 59.0043 429.72C59.4418 429.528 59.9408 429.433 60.5014 429.433C61.0665 429.433 61.5587 429.521 61.9779 429.699C62.4018 429.872 62.7367 430.114 62.9828 430.424C63.2289 430.729 63.3747 431.085 63.4203 431.49V431.497H61.9984V431.483C61.9301 431.224 61.766 431.007 61.5062 430.834C61.251 430.661 60.9138 430.574 60.4945 430.574C60.2256 430.574 59.9864 430.618 59.7768 430.704C59.5671 430.786 59.4008 430.902 59.2777 431.053C59.1592 431.199 59.1 431.372 59.1 431.572V431.586C59.1 431.741 59.1387 431.878 59.2162 431.996C59.2982 432.11 59.4258 432.213 59.599 432.304C59.7722 432.39 59.9955 432.468 60.2689 432.536L61.4516 432.803C62.1625 432.971 62.6911 433.215 63.0375 433.534C63.3884 433.853 63.5639 434.282 63.5639 434.819V434.833C63.5639 435.289 63.4294 435.692 63.1605 436.043C62.8917 436.389 62.5248 436.66 62.06 436.856C61.5997 437.048 61.0733 437.144 60.4809 437.144ZM65.2419 437V426.664H66.7253V430.697H66.8415C67.0238 430.301 67.2927 429.991 67.6481 429.768C68.0036 429.544 68.4525 429.433 68.9948 429.433C69.5463 429.433 70.0134 429.54 70.3962 429.754C70.779 429.968 71.0707 430.283 71.2712 430.697C71.4717 431.107 71.572 431.606 71.572 432.194V437H70.0817V432.543C70.0817 431.923 69.9519 431.463 69.6921 431.162C69.4369 430.857 69.0358 430.704 68.489 430.704C68.1289 430.704 67.8168 430.784 67.5524 430.943C67.2881 431.098 67.083 431.322 66.9372 431.613C66.7959 431.9 66.7253 432.244 66.7253 432.646V437H65.2419ZM77.4336 437.123C77.0872 437.123 76.7682 437.073 76.4766 436.973C76.1849 436.868 75.9251 436.72 75.6973 436.528C75.474 436.332 75.2917 436.1 75.1504 435.831H75.0342V437H73.5508V426.664H75.0342V430.752H75.1504C75.2826 430.483 75.4626 430.253 75.6904 430.062C75.9183 429.866 76.1803 429.715 76.4766 429.61C76.7728 429.501 77.0918 429.446 77.4336 429.446C78.0625 429.446 78.6071 429.604 79.0674 429.918C79.5277 430.228 79.8831 430.67 80.1338 431.244C80.3844 431.818 80.5098 432.497 80.5098 433.281V433.295C80.5098 434.074 80.3822 434.751 80.127 435.325C79.8763 435.899 79.5208 436.344 79.0605 436.658C78.6003 436.968 78.0579 437.123 77.4336 437.123ZM77.0098 435.852C77.4245 435.852 77.7799 435.749 78.0762 435.544C78.3724 435.339 78.598 435.045 78.7529 434.662C78.9124 434.279 78.9922 433.824 78.9922 433.295V433.281C78.9922 432.748 78.9124 432.292 78.7529 431.914C78.598 431.531 78.3724 431.237 78.0762 431.032C77.7799 430.823 77.4245 430.718 77.0098 430.718C76.5996 430.718 76.2441 430.823 75.9434 431.032C75.6426 431.237 75.4124 431.531 75.2529 431.914C75.0934 432.297 75.0137 432.753 75.0137 433.281V433.295C75.0137 433.819 75.0934 434.275 75.2529 434.662C75.4124 435.045 75.6426 435.339 75.9434 435.544C76.2441 435.749 76.5996 435.852 77.0098 435.852ZM85.264 437.144C84.5394 437.144 83.9127 436.989 83.3841 436.679C82.86 436.369 82.4567 435.927 82.1741 435.353C81.8916 434.774 81.7503 434.088 81.7503 433.295V433.281C81.7503 432.484 81.8916 431.798 82.1741 431.224C82.4612 430.649 82.8668 430.207 83.3909 429.897C83.9196 429.588 84.5439 429.433 85.264 429.433C85.9886 429.433 86.6129 429.588 87.137 429.897C87.6611 430.203 88.0644 430.645 88.347 431.224C88.6341 431.798 88.7776 432.484 88.7776 433.281V433.295C88.7776 434.088 88.6341 434.774 88.347 435.353C88.0644 435.927 87.6611 436.369 87.137 436.679C86.6175 436.989 85.9931 437.144 85.264 437.144ZM85.264 435.899C85.6878 435.899 86.0478 435.797 86.344 435.592C86.6403 435.382 86.8659 435.084 87.0208 434.696C87.1758 434.309 87.2532 433.842 87.2532 433.295V433.281C87.2532 432.73 87.1758 432.26 87.0208 431.873C86.8659 431.486 86.6403 431.189 86.344 430.984C86.0478 430.775 85.6878 430.67 85.264 430.67C84.8401 430.67 84.4801 430.775 84.1839 430.984C83.8877 431.189 83.6598 431.486 83.5003 431.873C83.3453 432.26 83.2679 432.73 83.2679 433.281V433.295C83.2679 433.842 83.3453 434.309 83.5003 434.696C83.6598 435.084 83.8877 435.382 84.1839 435.592C84.4801 435.797 84.8401 435.899 85.264 435.899ZM92.4244 437.123C91.955 437.123 91.5335 437.034 91.1598 436.856C90.7906 436.674 90.499 436.417 90.2848 436.084C90.0706 435.751 89.9635 435.362 89.9635 434.915V434.901C89.9635 434.455 90.0706 434.074 90.2848 433.76C90.5035 433.445 90.818 433.199 91.2281 433.021C91.6428 432.839 92.1441 432.73 92.732 432.693L95.4733 432.529V433.575L92.9371 433.739C92.4267 433.771 92.0507 433.881 91.8092 434.067C91.5677 434.25 91.4469 434.507 91.4469 434.84V434.854C91.4469 435.191 91.5768 435.457 91.8365 435.653C92.0963 435.845 92.4244 435.94 92.8209 435.94C93.19 435.94 93.5182 435.868 93.8053 435.722C94.0969 435.571 94.3248 435.371 94.4889 435.12C94.6529 434.865 94.735 434.578 94.735 434.259V431.921C94.735 431.511 94.6074 431.199 94.3522 430.984C94.1015 430.766 93.7278 430.656 93.2311 430.656C92.8164 430.656 92.4768 430.729 92.2125 430.875C91.9527 431.021 91.7796 431.226 91.693 431.49L91.6793 431.511H90.2506L90.2574 431.463C90.3167 431.053 90.4785 430.697 90.7428 430.396C91.0117 430.091 91.3626 429.854 91.7955 429.686C92.233 429.517 92.732 429.433 93.2926 429.433C93.9169 429.433 94.4456 429.533 94.8785 429.733C95.316 429.929 95.6464 430.214 95.8697 430.588C96.0976 430.957 96.2115 431.401 96.2115 431.921V437H94.735V435.947H94.6256C94.4798 436.198 94.2975 436.412 94.0787 436.59C93.86 436.763 93.6116 436.895 93.3336 436.986C93.0556 437.077 92.7525 437.123 92.4244 437.123ZM98.1493 437V429.576H99.6327V430.697H99.7489C99.8811 430.301 100.114 429.993 100.446 429.774C100.783 429.556 101.198 429.446 101.69 429.446C101.813 429.446 101.934 429.453 102.053 429.467C102.171 429.48 102.267 429.496 102.34 429.515V430.882C102.208 430.854 102.075 430.834 101.943 430.82C101.816 430.807 101.681 430.8 101.54 430.8C101.162 430.8 100.829 430.873 100.542 431.019C100.259 431.164 100.036 431.369 99.872 431.634C99.7125 431.894 99.6327 432.203 99.6327 432.563V437H98.1493ZM106.13 437.123C105.51 437.123 104.968 436.968 104.503 436.658C104.043 436.344 103.685 435.899 103.43 435.325C103.179 434.751 103.054 434.074 103.054 433.295V433.281C103.054 432.497 103.179 431.818 103.43 431.244C103.681 430.67 104.036 430.228 104.496 429.918C104.957 429.604 105.501 429.446 106.13 429.446C106.472 429.446 106.791 429.501 107.087 429.61C107.383 429.715 107.645 429.866 107.873 430.062C108.101 430.253 108.281 430.483 108.413 430.752H108.523V426.664H110.013V437H108.523V435.831H108.413C108.267 436.1 108.083 436.332 107.86 436.528C107.636 436.72 107.379 436.868 107.087 436.973C106.795 437.073 106.476 437.123 106.13 437.123ZM106.554 435.852C106.964 435.852 107.32 435.749 107.62 435.544C107.921 435.339 108.151 435.045 108.311 434.662C108.47 434.275 108.55 433.819 108.55 433.295V433.281C108.55 432.753 108.468 432.297 108.304 431.914C108.144 431.531 107.914 431.237 107.613 431.032C107.317 430.823 106.964 430.718 106.554 430.718C106.144 430.718 105.788 430.823 105.488 431.032C105.191 431.237 104.963 431.531 104.804 431.914C104.649 432.292 104.572 432.748 104.572 433.281V433.295C104.572 433.824 104.649 434.279 104.804 434.662C104.963 435.045 105.191 435.339 105.488 435.544C105.788 435.749 106.144 435.852 106.554 435.852Z"
                        fill={theme.iconPrimary}
                    />
                    <path
                        d="M180.281 417V407.136H182.051L185.189 414.997H185.305L188.443 407.136H190.213V417H188.812V409.768H188.053L189.653 407.409L185.811 417H184.676L180.841 407.409L182.434 409.768H181.682V417H180.281ZM194.393 417.123C193.924 417.123 193.502 417.034 193.129 416.856C192.76 416.674 192.468 416.417 192.254 416.084C192.04 415.751 191.932 415.362 191.932 414.915V414.901C191.932 414.455 192.04 414.074 192.254 413.76C192.473 413.445 192.787 413.199 193.197 413.021C193.612 412.839 194.113 412.73 194.701 412.693L197.442 412.529V413.575L194.906 413.739C194.396 413.771 194.02 413.881 193.778 414.067C193.537 414.25 193.416 414.507 193.416 414.84V414.854C193.416 415.191 193.546 415.457 193.806 415.653C194.065 415.845 194.393 415.94 194.79 415.94C195.159 415.94 195.487 415.868 195.774 415.722C196.066 415.571 196.294 415.371 196.458 415.12C196.622 414.865 196.704 414.578 196.704 414.259V411.921C196.704 411.511 196.576 411.199 196.321 410.984C196.07 410.766 195.697 410.656 195.2 410.656C194.785 410.656 194.446 410.729 194.181 410.875C193.922 411.021 193.749 411.226 193.662 411.49L193.648 411.511H192.22L192.226 411.463C192.286 411.053 192.447 410.697 192.712 410.396C192.981 410.091 193.332 409.854 193.764 409.686C194.202 409.517 194.701 409.433 195.262 409.433C195.886 409.433 196.415 409.533 196.848 409.733C197.285 409.929 197.615 410.214 197.839 410.588C198.067 410.957 198.181 411.401 198.181 411.921V417H196.704V415.947H196.595C196.449 416.198 196.266 416.412 196.048 416.59C195.829 416.763 195.581 416.895 195.303 416.986C195.025 417.077 194.722 417.123 194.393 417.123ZM200.139 417V409.576H201.629V417H200.139ZM200.891 408.25C200.636 408.25 200.417 408.159 200.235 407.977C200.052 407.794 199.961 407.576 199.961 407.32C199.961 407.065 200.052 406.849 200.235 406.671C200.417 406.489 200.636 406.397 200.891 406.397C201.146 406.397 201.365 406.489 201.547 406.671C201.729 406.849 201.82 407.065 201.82 407.32C201.82 407.576 201.729 407.794 201.547 407.977C201.365 408.159 201.146 408.25 200.891 408.25ZM203.628 417V409.576H205.112V410.697H205.228C205.41 410.301 205.679 409.991 206.035 409.768C206.39 409.544 206.839 409.433 207.381 409.433C208.215 409.433 208.853 409.672 209.295 410.15C209.737 410.629 209.958 411.31 209.958 412.194V417H208.468V412.543C208.468 411.923 208.338 411.463 208.079 411.162C207.823 410.857 207.422 410.704 206.875 410.704C206.515 410.704 206.203 410.784 205.939 410.943C205.675 411.098 205.47 411.322 205.324 411.613C205.182 411.9 205.112 412.244 205.112 412.646V417H203.628ZM176.347 437.239C175.604 437.239 174.957 437.123 174.406 436.891C173.854 436.654 173.419 436.326 173.1 435.906C172.781 435.487 172.599 435.002 172.553 434.45L172.546 434.361H174.057L174.064 434.437C174.096 434.733 174.212 434.99 174.412 435.209C174.617 435.428 174.891 435.599 175.233 435.722C175.579 435.845 175.973 435.906 176.415 435.906C176.83 435.906 177.199 435.84 177.523 435.708C177.846 435.576 178.099 435.394 178.281 435.161C178.468 434.929 178.562 434.662 178.562 434.361V434.354C178.562 433.976 178.418 433.662 178.131 433.411C177.844 433.16 177.375 432.965 176.723 432.823L175.643 432.598C174.645 432.383 173.918 432.044 173.462 431.579C173.006 431.11 172.779 430.51 172.779 429.781V429.774C172.783 429.205 172.936 428.703 173.237 428.271C173.542 427.838 173.963 427.5 174.501 427.259C175.039 427.017 175.656 426.896 176.354 426.896C177.051 426.896 177.659 427.017 178.179 427.259C178.703 427.496 179.115 427.819 179.416 428.229C179.722 428.64 179.892 429.102 179.929 429.617L179.936 429.706H178.439L178.425 429.617C178.384 429.348 178.272 429.109 178.09 428.899C177.912 428.69 177.673 428.526 177.372 428.407C177.076 428.284 176.73 428.225 176.333 428.229C175.95 428.229 175.609 428.289 175.308 428.407C175.007 428.521 174.768 428.688 174.59 428.906C174.417 429.125 174.33 429.389 174.33 429.699V429.706C174.33 430.071 174.469 430.376 174.747 430.622C175.03 430.864 175.488 431.053 176.121 431.189L177.201 431.429C177.89 431.575 178.448 431.768 178.876 432.01C179.305 432.251 179.617 432.55 179.813 432.905C180.013 433.256 180.114 433.675 180.114 434.163V434.17C180.114 434.799 179.959 435.343 179.649 435.804C179.343 436.259 178.908 436.613 178.343 436.863C177.778 437.114 177.113 437.239 176.347 437.239ZM184.929 437.144C184.209 437.144 183.587 436.989 183.063 436.679C182.544 436.364 182.142 435.918 181.86 435.339C181.577 434.76 181.436 434.07 181.436 433.268V433.254C181.436 432.465 181.575 431.786 181.853 431.217C182.136 430.647 182.537 430.207 183.056 429.897C183.58 429.588 184.202 429.433 184.922 429.433C185.547 429.433 186.082 429.542 186.529 429.761C186.98 429.975 187.338 430.271 187.602 430.649C187.871 431.023 188.04 431.449 188.108 431.928L188.115 431.962H186.686L186.679 431.948C186.597 431.584 186.408 431.281 186.112 431.039C185.816 430.793 185.421 430.67 184.929 430.67C184.519 430.67 184.166 430.775 183.87 430.984C183.573 431.189 183.346 431.486 183.186 431.873C183.031 432.26 182.954 432.721 182.954 433.254V433.268C182.954 433.814 183.033 434.284 183.193 434.676C183.352 435.068 183.58 435.371 183.877 435.585C184.173 435.795 184.524 435.899 184.929 435.899C185.394 435.899 185.77 435.797 186.057 435.592C186.349 435.387 186.554 435.084 186.672 434.683L186.686 434.648L188.108 434.642L188.094 434.703C188.008 435.186 187.832 435.61 187.568 435.975C187.304 436.339 186.95 436.626 186.508 436.836C186.071 437.041 185.544 437.144 184.929 437.144ZM189.636 437V429.576H191.119V430.697H191.235C191.367 430.301 191.6 429.993 191.932 429.774C192.27 429.556 192.684 429.446 193.177 429.446C193.3 429.446 193.42 429.453 193.539 429.467C193.657 429.48 193.753 429.496 193.826 429.515V430.882C193.694 430.854 193.562 430.834 193.43 430.82C193.302 430.807 193.167 430.8 193.026 430.8C192.648 430.8 192.315 430.873 192.028 431.019C191.746 431.164 191.522 431.369 191.358 431.634C191.199 431.894 191.119 432.203 191.119 432.563V437H189.636ZM198.027 437.144C197.302 437.144 196.68 436.989 196.16 436.679C195.641 436.364 195.24 435.92 194.957 435.346C194.679 434.771 194.54 434.092 194.54 433.309V433.302C194.54 432.527 194.679 431.85 194.957 431.271C195.24 430.693 195.636 430.242 196.147 429.918C196.662 429.594 197.263 429.433 197.951 429.433C198.644 429.433 199.239 429.588 199.736 429.897C200.237 430.207 200.622 430.643 200.891 431.203C201.16 431.759 201.294 432.411 201.294 433.158V433.678H195.292V432.618H200.556L199.845 433.603V433.008C199.845 432.479 199.763 432.042 199.599 431.695C199.439 431.344 199.218 431.082 198.936 430.909C198.653 430.736 198.327 430.649 197.958 430.649C197.589 430.649 197.259 430.741 196.967 430.923C196.68 431.101 196.452 431.365 196.283 431.716C196.119 432.067 196.037 432.497 196.037 433.008V433.603C196.037 434.09 196.119 434.507 196.283 434.854C196.447 435.2 196.68 435.464 196.981 435.646C197.286 435.829 197.646 435.92 198.061 435.92C198.38 435.92 198.653 435.877 198.881 435.79C199.113 435.699 199.303 435.587 199.448 435.455C199.599 435.323 199.701 435.193 199.756 435.065L199.783 435.011H201.219L201.205 435.072C201.141 435.318 201.03 435.564 200.87 435.811C200.711 436.052 200.499 436.273 200.235 436.474C199.975 436.674 199.66 436.836 199.291 436.959C198.927 437.082 198.505 437.144 198.027 437.144ZM206.021 437.144C205.296 437.144 204.674 436.989 204.155 436.679C203.635 436.364 203.234 435.92 202.952 435.346C202.674 434.771 202.535 434.092 202.535 433.309V433.302C202.535 432.527 202.674 431.85 202.952 431.271C203.234 430.693 203.631 430.242 204.141 429.918C204.656 429.594 205.258 429.433 205.946 429.433C206.638 429.433 207.233 429.588 207.73 429.897C208.231 430.207 208.616 430.643 208.885 431.203C209.154 431.759 209.289 432.411 209.289 433.158V433.678H203.287V432.618H208.55L207.839 433.603V433.008C207.839 432.479 207.757 432.042 207.593 431.695C207.434 431.344 207.213 431.082 206.93 430.909C206.648 430.736 206.322 430.649 205.953 430.649C205.583 430.649 205.253 430.741 204.961 430.923C204.674 431.101 204.446 431.365 204.278 431.716C204.114 432.067 204.032 432.497 204.032 433.008V433.603C204.032 434.09 204.114 434.507 204.278 434.854C204.442 435.2 204.674 435.464 204.975 435.646C205.28 435.829 205.64 435.92 206.055 435.92C206.374 435.92 206.648 435.877 206.875 435.79C207.108 435.699 207.297 435.587 207.443 435.455C207.593 435.323 207.696 435.193 207.75 435.065L207.778 435.011H209.213L209.2 435.072C209.136 435.318 209.024 435.564 208.865 435.811C208.705 436.052 208.493 436.273 208.229 436.474C207.969 436.674 207.655 436.836 207.286 436.959C206.921 437.082 206.499 437.144 206.021 437.144ZM210.898 437V429.576H212.382V430.697H212.498C212.68 430.301 212.949 429.991 213.304 429.768C213.66 429.544 214.109 429.433 214.651 429.433C215.485 429.433 216.123 429.672 216.565 430.15C217.007 430.629 217.228 431.31 217.228 432.194V437H215.738V432.543C215.738 431.923 215.608 431.463 215.348 431.162C215.093 430.857 214.692 430.704 214.145 430.704C213.785 430.704 213.473 430.784 213.209 430.943C212.944 431.098 212.739 431.322 212.594 431.613C212.452 431.9 212.382 432.244 212.382 432.646V437H210.898Z"
                        fill={theme.iconPrimary}
                    />
                    <path
                        d="M294.318 417V408.462H291.215V407.136H298.953V408.462H295.85V417H294.318ZM302.306 417.144C301.581 417.144 300.955 416.989 300.426 416.679C299.902 416.369 299.499 415.927 299.216 415.353C298.934 414.774 298.792 414.088 298.792 413.295V413.281C298.792 412.484 298.934 411.798 299.216 411.224C299.503 410.649 299.909 410.207 300.433 409.897C300.962 409.588 301.586 409.433 302.306 409.433C303.031 409.433 303.655 409.588 304.179 409.897C304.703 410.203 305.107 410.645 305.389 411.224C305.676 411.798 305.82 412.484 305.82 413.281V413.295C305.82 414.088 305.676 414.774 305.389 415.353C305.107 415.927 304.703 416.369 304.179 416.679C303.66 416.989 303.035 417.144 302.306 417.144ZM302.306 415.899C302.73 415.899 303.09 415.797 303.386 415.592C303.682 415.382 303.908 415.084 304.063 414.696C304.218 414.309 304.295 413.842 304.295 413.295V413.281C304.295 412.73 304.218 412.26 304.063 411.873C303.908 411.486 303.682 411.189 303.386 410.984C303.09 410.775 302.73 410.67 302.306 410.67C301.882 410.67 301.522 410.775 301.226 410.984C300.93 411.189 300.702 411.486 300.542 411.873C300.387 412.26 300.31 412.73 300.31 413.281V413.295C300.31 413.842 300.387 414.309 300.542 414.696C300.702 415.084 300.93 415.382 301.226 415.592C301.522 415.797 301.882 415.899 302.306 415.899ZM310.574 417.144C309.849 417.144 309.223 416.989 308.694 416.679C308.17 416.369 307.767 415.927 307.484 415.353C307.202 414.774 307.06 414.088 307.06 413.295V413.281C307.06 412.484 307.202 411.798 307.484 411.224C307.771 410.649 308.177 410.207 308.701 409.897C309.23 409.588 309.854 409.433 310.574 409.433C311.299 409.433 311.923 409.588 312.447 409.897C312.971 410.203 313.374 410.645 313.657 411.224C313.944 411.798 314.088 412.484 314.088 413.281V413.295C314.088 414.088 313.944 414.774 313.657 415.353C313.374 415.927 312.971 416.369 312.447 416.679C311.927 416.989 311.303 417.144 310.574 417.144ZM310.574 415.899C310.998 415.899 311.358 415.797 311.654 415.592C311.95 415.382 312.176 415.084 312.331 414.696C312.486 414.309 312.563 413.842 312.563 413.295V413.281C312.563 412.73 312.486 412.26 312.331 411.873C312.176 411.486 311.95 411.189 311.654 410.984C311.358 410.775 310.998 410.67 310.574 410.67C310.15 410.67 309.79 410.775 309.494 410.984C309.198 411.189 308.97 411.486 308.81 411.873C308.655 412.26 308.578 412.73 308.578 413.281V413.295C308.578 413.842 308.655 414.309 308.81 414.696C308.97 415.084 309.198 415.382 309.494 415.592C309.79 415.797 310.15 415.899 310.574 415.899ZM315.766 417V406.664H317.249V417H315.766ZM322.003 417.144C321.406 417.144 320.887 417.057 320.445 416.884C320.003 416.706 319.652 416.462 319.392 416.152C319.132 415.838 318.979 415.473 318.934 415.059V415.045H320.424V415.059C320.52 415.337 320.702 415.562 320.971 415.735C321.24 415.909 321.595 415.995 322.037 415.995C322.343 415.995 322.609 415.952 322.837 415.865C323.07 415.779 323.252 415.658 323.384 415.503C323.516 415.348 323.582 415.17 323.582 414.97V414.956C323.582 414.724 323.489 414.528 323.302 414.368C323.115 414.209 322.808 414.079 322.379 413.979L321.19 413.705C320.725 413.6 320.34 413.457 320.034 413.274C319.729 413.092 319.504 412.869 319.358 412.604C319.212 412.336 319.139 412.021 319.139 411.661V411.654C319.139 411.221 319.262 410.839 319.508 410.506C319.754 410.169 320.094 409.907 320.527 409.72C320.964 409.528 321.463 409.433 322.024 409.433C322.589 409.433 323.081 409.521 323.5 409.699C323.924 409.872 324.259 410.114 324.505 410.424C324.751 410.729 324.897 411.085 324.943 411.49V411.497H323.521V411.483C323.452 411.224 323.288 411.007 323.029 410.834C322.773 410.661 322.436 410.574 322.017 410.574C321.748 410.574 321.509 410.618 321.299 410.704C321.089 410.786 320.923 410.902 320.8 411.053C320.682 411.199 320.622 411.372 320.622 411.572V411.586C320.622 411.741 320.661 411.878 320.739 411.996C320.821 412.11 320.948 412.213 321.121 412.304C321.295 412.39 321.518 412.468 321.791 412.536L322.974 412.803C323.685 412.971 324.214 413.215 324.56 413.534C324.911 413.853 325.086 414.282 325.086 414.819V414.833C325.086 415.289 324.952 415.692 324.683 416.043C324.414 416.389 324.047 416.66 323.582 416.856C323.122 417.048 322.596 417.144 322.003 417.144ZM337.438 417L332.517 411.613C332.17 411.24 331.897 410.914 331.696 410.636C331.496 410.358 331.352 410.105 331.266 409.877C331.179 409.645 331.136 409.412 331.136 409.18V409.166C331.136 408.733 331.25 408.348 331.477 408.011C331.705 407.674 332.017 407.409 332.414 407.218C332.81 407.026 333.259 406.931 333.761 406.931C334.267 406.931 334.715 407.026 335.107 407.218C335.499 407.409 335.807 407.674 336.03 408.011C336.253 408.343 336.365 408.726 336.365 409.159V409.173C336.365 409.506 336.29 409.82 336.14 410.116C335.994 410.412 335.754 410.7 335.422 410.978C335.089 411.256 334.647 411.538 334.096 411.825L333.337 411.039C333.765 410.82 334.1 410.618 334.342 410.431C334.588 410.239 334.763 410.05 334.868 409.863C334.973 409.672 335.025 409.465 335.025 409.241V409.228C335.025 408.991 334.971 408.783 334.861 408.605C334.756 408.428 334.611 408.289 334.424 408.188C334.237 408.088 334.018 408.038 333.767 408.038C333.526 408.038 333.309 408.088 333.118 408.188C332.931 408.289 332.783 408.43 332.674 408.612C332.564 408.79 332.51 408.997 332.51 409.234V409.248C332.51 409.412 332.546 409.576 332.619 409.74C332.692 409.904 332.81 410.091 332.975 410.301C333.139 410.506 333.364 410.763 333.651 411.073L339.229 416.993V417H337.438ZM333.433 417.185C332.763 417.185 332.172 417.068 331.662 416.836C331.156 416.599 330.762 416.271 330.479 415.852C330.197 415.428 330.056 414.942 330.056 414.396V414.382C330.056 413.794 330.213 413.277 330.527 412.83C330.846 412.383 331.334 411.994 331.99 411.661L332.558 411.374L333.337 412.229L332.838 412.475C332.409 412.684 332.081 412.942 331.853 413.247C331.63 413.552 331.518 413.892 331.518 414.266V414.279C331.518 414.617 331.605 414.915 331.778 415.175C331.951 415.435 332.193 415.637 332.503 415.783C332.813 415.924 333.17 415.995 333.576 415.995C333.968 415.995 334.323 415.943 334.642 415.838C334.962 415.733 335.246 415.583 335.497 415.387C335.748 415.191 335.966 414.963 336.153 414.703C336.422 414.316 336.623 413.869 336.755 413.363C336.887 412.857 336.953 412.313 336.953 411.729V411.504H338.3V411.784C338.3 412.568 338.197 413.29 337.992 413.951C337.787 414.612 337.475 415.188 337.056 415.681C336.65 416.15 336.146 416.519 335.545 416.788C334.943 417.052 334.239 417.185 333.433 417.185ZM290.545 437L294.107 427.136H295.344V428.865H294.879L292.158 437H290.545ZM292.261 434.334L292.691 433.104H297.183L297.613 434.334H292.261ZM297.709 437L294.995 428.865V427.136H295.768L299.322 437H297.709ZM303.427 437.144C302.707 437.144 302.085 436.989 301.561 436.679C301.041 436.364 300.64 435.918 300.358 435.339C300.075 434.76 299.934 434.07 299.934 433.268V433.254C299.934 432.465 300.073 431.786 300.351 431.217C300.634 430.647 301.035 430.207 301.554 429.897C302.078 429.588 302.7 429.433 303.42 429.433C304.045 429.433 304.58 429.542 305.027 429.761C305.478 429.975 305.836 430.271 306.1 430.649C306.369 431.023 306.537 431.449 306.606 431.928L306.613 431.962H305.184L305.177 431.948C305.095 431.584 304.906 431.281 304.61 431.039C304.314 430.793 303.919 430.67 303.427 430.67C303.017 430.67 302.664 430.775 302.368 430.984C302.071 431.189 301.843 431.486 301.684 431.873C301.529 432.26 301.452 432.721 301.452 433.254V433.268C301.452 433.814 301.531 434.284 301.691 434.676C301.85 435.068 302.078 435.371 302.374 435.585C302.671 435.795 303.022 435.899 303.427 435.899C303.892 435.899 304.268 435.797 304.555 435.592C304.847 435.387 305.052 435.084 305.17 434.683L305.184 434.648L306.606 434.642L306.592 434.703C306.506 435.186 306.33 435.61 306.066 435.975C305.801 436.339 305.448 436.626 305.006 436.836C304.569 437.041 304.042 437.144 303.427 437.144ZM311.046 437.048C310.234 437.048 309.647 436.893 309.282 436.583C308.922 436.269 308.742 435.756 308.742 435.045V430.745H307.58V429.576H308.742V427.703H310.259V429.576H311.852V430.745H310.259V434.683C310.259 435.084 310.339 435.373 310.499 435.551C310.658 435.724 310.923 435.811 311.292 435.811C311.401 435.811 311.494 435.808 311.572 435.804C311.654 435.799 311.747 435.792 311.852 435.783V436.973C311.734 436.991 311.606 437.007 311.469 437.021C311.333 437.039 311.191 437.048 311.046 437.048ZM313.455 437V429.576H314.945V437H313.455ZM314.207 428.25C313.952 428.25 313.733 428.159 313.551 427.977C313.368 427.794 313.277 427.576 313.277 427.32C313.277 427.065 313.368 426.849 313.551 426.671C313.733 426.489 313.952 426.397 314.207 426.397C314.462 426.397 314.681 426.489 314.863 426.671C315.046 426.849 315.137 427.065 315.137 427.32C315.137 427.576 315.046 427.794 314.863 427.977C314.681 428.159 314.462 428.25 314.207 428.25ZM320.089 437.144C319.365 437.144 318.738 436.989 318.209 436.679C317.685 436.369 317.282 435.927 316.999 435.353C316.717 434.774 316.575 434.088 316.575 433.295V433.281C316.575 432.484 316.717 431.798 316.999 431.224C317.286 430.649 317.692 430.207 318.216 429.897C318.745 429.588 319.369 429.433 320.089 429.433C320.814 429.433 321.438 429.588 321.962 429.897C322.486 430.203 322.89 430.645 323.172 431.224C323.459 431.798 323.603 432.484 323.603 433.281V433.295C323.603 434.088 323.459 434.774 323.172 435.353C322.89 435.927 322.486 436.369 321.962 436.679C321.443 436.989 320.818 437.144 320.089 437.144ZM320.089 435.899C320.513 435.899 320.873 435.797 321.169 435.592C321.465 435.382 321.691 435.084 321.846 434.696C322.001 434.309 322.078 433.842 322.078 433.295V433.281C322.078 432.73 322.001 432.26 321.846 431.873C321.691 431.486 321.465 431.189 321.169 430.984C320.873 430.775 320.513 430.67 320.089 430.67C319.665 430.67 319.305 430.775 319.009 430.984C318.713 431.189 318.485 431.486 318.325 431.873C318.171 432.26 318.093 432.73 318.093 433.281V433.295C318.093 433.842 318.171 434.309 318.325 434.696C318.485 435.084 318.713 435.382 319.009 435.592C319.305 435.797 319.665 435.899 320.089 435.899ZM325.213 437V429.576H326.696V430.697H326.812C326.994 430.301 327.263 429.991 327.619 429.768C327.974 429.544 328.423 429.433 328.965 429.433C329.799 429.433 330.437 429.672 330.88 430.15C331.322 430.629 331.543 431.31 331.543 432.194V437H330.052V432.543C330.052 431.923 329.922 431.463 329.663 431.162C329.407 430.857 329.006 430.704 328.46 430.704C328.1 430.704 327.787 430.784 327.523 430.943C327.259 431.098 327.054 431.322 326.908 431.613C326.767 431.9 326.696 432.244 326.696 432.646V437H325.213ZM336.153 437.144C335.556 437.144 335.037 437.057 334.595 436.884C334.153 436.706 333.802 436.462 333.542 436.152C333.282 435.838 333.129 435.473 333.084 435.059V435.045H334.574V435.059C334.67 435.337 334.852 435.562 335.121 435.735C335.39 435.909 335.745 435.995 336.187 435.995C336.493 435.995 336.759 435.952 336.987 435.865C337.22 435.779 337.402 435.658 337.534 435.503C337.666 435.348 337.732 435.17 337.732 434.97V434.956C337.732 434.724 337.639 434.528 337.452 434.368C337.265 434.209 336.958 434.079 336.529 433.979L335.34 433.705C334.875 433.6 334.49 433.457 334.184 433.274C333.879 433.092 333.654 432.869 333.508 432.604C333.362 432.336 333.289 432.021 333.289 431.661V431.654C333.289 431.221 333.412 430.839 333.658 430.506C333.904 430.169 334.244 429.907 334.677 429.72C335.114 429.528 335.613 429.433 336.174 429.433C336.739 429.433 337.231 429.521 337.65 429.699C338.074 429.872 338.409 430.114 338.655 430.424C338.901 430.729 339.047 431.085 339.093 431.49V431.497H337.671V431.483C337.602 431.224 337.438 431.007 337.179 430.834C336.923 430.661 336.586 430.574 336.167 430.574C335.898 430.574 335.659 430.618 335.449 430.704C335.239 430.786 335.073 430.902 334.95 431.053C334.832 431.199 334.772 431.372 334.772 431.572V431.586C334.772 431.741 334.811 431.878 334.889 431.996C334.971 432.11 335.098 432.213 335.271 432.304C335.445 432.39 335.668 432.468 335.941 432.536L337.124 432.803C337.835 432.971 338.364 433.215 338.71 433.534C339.061 433.853 339.236 434.282 339.236 434.819V434.833C339.236 435.289 339.102 435.692 338.833 436.043C338.564 436.389 338.197 436.66 337.732 436.856C337.272 437.048 336.746 437.144 336.153 437.144Z"
                        fill={theme.iconPrimary}
                    />
                    <defs>
                        <linearGradient
                            id="paint0_linear_56736_545803"
                            x1="119.5"
                            y1="301"
                            x2="119.5"
                            y2="333"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop />
                            <stop offset="1" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient
                            id="paint1_linear_56736_545803"
                            x1="272.5"
                            y1="301"
                            x2="272.5"
                            y2="333"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop />
                            <stop offset="1" stopOpacity="0" />
                        </linearGradient>
                        <clipPath id="clip0_56736_545803">
                            <rect x="129" y="122" width="132" height="171" rx="6" fill="white" />
                        </clipPath>
                        <clipPath id="clip1_56736_545803">
                            <rect
                                width="16"
                                height="14"
                                fill="white"
                                transform="translate(130 302)"
                            />
                        </clipPath>
                        <clipPath id="clip2_56736_545803">
                            <rect
                                width="16"
                                height="14"
                                fill="white"
                                transform="matrix(-1 0 0 1 260 302)"
                            />
                        </clipPath>
                    </defs>
                </svg>
            </TutorialFirstBlockWrapper>
            <SecondBlockWrapper>
                <Button primary fullWidth size="large" onClick={onSubmit}>
                    {t('start')}
                </Button>
            </SecondBlockWrapper>
        </FullScreenWrapper>
    );
};
