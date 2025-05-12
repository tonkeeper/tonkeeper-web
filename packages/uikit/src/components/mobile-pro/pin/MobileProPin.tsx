import React, { FC, PropsWithChildren, useState } from 'react';
import styled, { css } from 'styled-components';
import { H3 } from '../../Text';
import { useAppSdk } from '../../../hooks/appSdk';
import { IconButtonTransparentBackground } from '../../fields/IconButton';
import { ArrowLeftIcon } from '../../Icon';

const Container = styled.div`
    height: 100%;
    background-color: ${p => p.theme.backgroundPage};
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
`;

const Header = styled.div`
    flex: 1;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    padding: 0 32px;
`;

const DotsContainer = styled.div`
    display: flex;
    gap: 16px;
    margin-top: 20px;
`;

const Dot = styled.div<{ $type: 'success' | 'error' | 'active' | undefined }>`
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: ${props =>
        props.$type === 'active'
            ? props.theme.accentBlueConstant
            : props.$type === 'success'
            ? props.theme.accentGreen
            : props.$type === 'error'
            ? props.theme.accentRed
            : props.theme.iconSecondary};
    transition: background-color 0.3s ease;

    ${p =>
        p.$type === 'active' &&
        css`
            animation: upscaleActive 0.3s ease;
        `};

    ${p =>
        p.$type === 'success' &&
        css`
            animation: upscaleSuccess 0.5s ease;
        `};

    ${p =>
        p.$type === 'error' &&
        css`
            animation: shake 0.2s ease infinite;
        `};

    @keyframes upscaleActive {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.3);
        }
        100% {
            transform: scale(1);
        }
    }

    @keyframes upscaleSuccess {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.3);
        }
        100% {
            transform: scale(1);
        }
    }

    @keyframes shake {
        0% {
            transform: translateX(0);
        }
        25% {
            transform: translateX(4px);
        }
        75% {
            transform: translateX(-4px);
        }
        100% {
            transform: translateX(0);
        }
    }
`;

const Keypad = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    row-gap: 32px;
    width: 100%;
    padding: 16px;
    justify-items: center;
`;

const KeyButton = styled.button`
    box-sizing: content-box;
    background: none;
    border: none;
    font-size: 32px;
    font-weight: 500;
    width: 40px;
    height: 40px;
    cursor: pointer;
    border-radius: 50%;
    transition: transform 0.15s ease;
    margin: 0 auto;
`;

const DeleteButton = styled(KeyButton)`
    font-size: 24px;
`;

const BackButton = styled(IconButtonTransparentBackground)`
    margin: 16px auto 0 16px;
`;

export const MobileProPin: FC<{
    className?: string;
    title: string;
    onSubmit: (val: string) => Promise<boolean | undefined> | void;
    onBack?: () => void;
    validated?: 'success' | 'error' | undefined;
}> = ({ className, onSubmit, title, onBack, validated: externalValidated }) => {
    const [pin, setPin] = useState<string>('');
    const maxLength = 4;
    const [validationResult, setValidationResult] = useState<'success' | 'error' | undefined>();
    const sdk = useAppSdk();

    const handleNumberClick = (number: string) => {
        if (pin.length >= maxLength || externalValidated) {
            return;
        }

        sdk.hapticNotification('impact_light');
        const newPin = pin + number;
        setPin(newPin);

        if (newPin.length === maxLength) {
            (onSubmit(newPin) || Promise.resolve(undefined)).then(result => {
                if (result === false) {
                    setValidationResult('error');
                    sdk.hapticNotification('error');
                    setTimeout(() => setValidationResult(undefined), 400);
                    setPin('');
                } else if (result === true) {
                    setValidationResult('success');
                    sdk.hapticNotification('success');
                }
            });
        }
    };

    const handleDelete = () => {
        if (pin.length !== 4 && !externalValidated) {
            sdk.hapticNotification('impact_light');
            setPin(prev => prev.slice(0, -1));
        }
    };

    return (
        <Container className={className}>
            {onBack && (
                <BackButton onClick={onBack}>
                    <ArrowLeftIcon />
                </BackButton>
            )}
            <Header>
                <H3>{title}</H3>

                <DotsContainer>
                    {Array(maxLength)
                        .fill(0)
                        .map((_, index) => (
                            <Dot
                                key={index}
                                $type={
                                    externalValidated
                                        ? externalValidated
                                        : validationResult
                                        ? validationResult
                                        : index < pin.length
                                        ? 'active'
                                        : undefined
                                }
                            />
                        ))}
                </DotsContainer>
            </Header>

            <Keypad>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(number => (
                    <TouchAnimation
                        key={number}
                        onClick={() => handleNumberClick(number.toString())}
                    >
                        <KeyButton>{number}</KeyButton>
                    </TouchAnimation>
                ))}
                <div style={{ visibility: 'hidden' }} />
                <TouchAnimation onClick={() => handleNumberClick('0')}>
                    <KeyButton>0</KeyButton>
                </TouchAnimation>
                <TouchAnimation
                    onClick={handleDelete}
                    isDisabled={pin.length === 4 || !!externalValidated}
                >
                    <DeleteButton>
                        <DeleteIcon />
                    </DeleteButton>
                </TouchAnimation>
            </Keypad>
        </Container>
    );
};

const DeleteIcon = () => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.35 8.2L2.88 14.16C1.84722 15.537 1.33084 16.2256 1.13178 16.9817C0.956073 17.6492 0.956073 18.3508 1.13178 19.0183C1.33084 19.7744 1.84722 20.463 2.88 21.84L7.35 27.8C8.23 28.9733 8.67 29.56 9.22763 29.9831C9.72151 30.3579 10.2808 30.6375 10.8769 30.8078C11.55 31 12.2833 31 13.75 31H25.6C27.8402 31 28.9603 31 29.816 30.564C30.5686 30.1805 31.1805 29.5686 31.564 28.816C32 27.9603 32 26.8402 32 24.6V11.4C32 9.15979 32 8.03969 31.564 7.18404C31.1805 6.43139 30.5686 5.81947 29.816 5.43597C28.9603 5 27.8402 5 25.6 5H13.75C12.2833 5 11.55 5 10.8769 5.19223C10.2808 5.36248 9.72151 5.64212 9.22763 6.01688C8.67 6.44001 8.22999 7.02668 7.35 8.2ZM15.6339 12.8661C15.1457 12.378 14.3543 12.378 13.8661 12.8661C13.378 13.3543 13.378 14.1457 13.8661 14.6339L17.2322 18L13.8661 21.3661C13.378 21.8543 13.378 22.6457 13.8661 23.1339C14.3543 23.622 15.1457 23.622 15.6339 23.1339L18.999 19.7688L22.3551 23.1328C22.8427 23.6216 23.6341 23.6225 24.1228 23.1349C24.6116 22.6473 24.6125 21.8559 24.1249 21.3672L20.7667 18.001L24.1339 14.6339C24.622 14.1457 24.622 13.3543 24.1339 12.8661C23.6457 12.378 22.8543 12.378 22.3661 12.8661L19 16.2322L15.6339 12.8661Z"
                fill="currentColor"
            />
        </svg>
    );
};

const TouchAnimationWrapper = styled.div<{ $isTouching: boolean }>`
    position: relative;
    &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        background-color: ${p => p.theme.iconTertiary};
        border-radius: 100%;
        width: 60px;
        height: 60px;
        opacity: 0;
        transform: translate(-50%, -50%) scale(0);

        transition: opacity 0.1s ease-in-out, transform 0.1s ease-in-out;

        ${p =>
            p.$isTouching &&
            css`
                transform: translate(-50%, -50%) scale(1);
                opacity: 0.3;
            `}
    }

    & > * {
        position: relative;
        z-index: 1;
    }
`;

const TouchAnimation: FC<
    PropsWithChildren & React.HTMLAttributes<HTMLDivElement> & { isDisabled?: boolean }
> = ({ children, isDisabled, ...props }) => {
    const [isTouching, setIsTouching] = useState(false);

    return (
        <TouchAnimationWrapper
            onTouchStart={() => !isDisabled && setIsTouching(true)}
            onTouchEnd={() => setIsTouching(false)}
            $isTouching={isTouching}
            {...props}
        >
            {children}
        </TouchAnimationWrapper>
    );
};
