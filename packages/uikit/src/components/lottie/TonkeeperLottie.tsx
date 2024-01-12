import React, { FC } from 'react';
import Lottie from 'react-lottie';
import animationTonkeeperLogoData from './TonkeeperLogo.json';

const defaultTonkeeperLogoOptions = {
    autoplay: true,
    animationData: animationTonkeeperLogoData,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
    }
};

const TonkeeperLogoLottieIcon: FC<{
    width: string;
    height: string;
    loop: boolean;
}> = ({ width, height, loop }) => {
    return (
        <Lottie
            options={{ ...defaultTonkeeperLogoOptions, loop }}
            height={parseInt(height)}
            width={parseInt(width)}
        />
    );
};

const TonkeeperIcon: FC<{
    width?: string;
    height?: string;
    loop?: boolean;
}> = ({ width = '128', height = '128', loop = false }) => {
    return <TonkeeperLogoLottieIcon width={width} height={height} loop={loop} />;
};

export default TonkeeperIcon;
