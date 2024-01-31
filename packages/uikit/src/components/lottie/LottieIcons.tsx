import React, { FC } from 'react';
import Lottie from 'react-lottie';
import animationCheckData from './Check.json';
import animationConfettiData from './Confetti.json';
import animationGearData from './Gear.json';
import animationWriteData from './Write.json';

const defaultCheckOptions = {
    loop: false,
    autoplay: true,
    animationData: animationCheckData,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
    }
};

export const CheckLottieIcon = () => {
    return <Lottie options={defaultCheckOptions} height={160} width={160} />;
};

const defaultGearOptions = {
    loop: false,
    autoplay: true,
    animationData: animationGearData,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
    }
};

export const GearLottieIcon = () => {
    return <Lottie options={defaultGearOptions} height={160} width={160} />;
};

const defaultWriteOptions = {
    loop: false,
    autoplay: true,
    animationData: animationWriteData,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
    }
};

export const WriteLottieIcon = () => {
    return <Lottie options={defaultWriteOptions} height={160} width={160} />;
};

const defaultConfettiOptions = {
    loop: false,
    autoplay: true,
    animationData: animationConfettiData,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
    }
};

export const ConfettiLottieIcon: FC<{ width: number; height: number }> = ({ width, height }) => {
    return <Lottie options={defaultConfettiOptions} height={height} width={width} />;
};

export const NotificationIcon = () => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="128"
            height="128"
            viewBox="0 0 128 128"
            fill="none"
        >
            <path
                d="M107.965 41.8795C105.62 43.2285 102.9 44 100 44C91.1634 44 84 36.8366 84 28C84 25.1 84.7715 22.3802 86.1205 20.0347C84.1104 20 81.8262 20 79.2 20L48.8 20C38.7191 20 33.6786 20 29.8282 21.9619C26.4413 23.6876 23.6876 26.4413 21.9619 29.8282C20 33.6786 20 38.7191 20 48.8L20 79.2C20 89.2809 20 94.3214 21.9619 98.1718C23.6876 101.559 26.4413 104.312 29.8282 106.038C33.6786 108 38.7191 108 48.8 108H79.2C89.2809 108 94.3214 108 98.1718 106.038C101.559 104.312 104.312 101.559 106.038 98.1718C108 94.3214 108 89.2809 108 79.2V48.8C108 46.1738 108 43.8896 107.965 41.8795Z"
                fill="#45AEF5"
            />
            <circle opacity="0.32" cx="100" cy="28" r="16" fill="#45AEF5" />
        </svg>
    );
};
