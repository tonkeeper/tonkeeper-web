import React, { FC } from 'react';
import animationTonkeeperLogoData from './TonkeeperLogo.json';
import { Lottie } from './Lottie';

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
    return <Lottie {...{ ...defaultTonkeeperLogoOptions, loop }} height={height} width={width} />;
};

const TonkeeperIcon: FC<{
    width?: string;
    height?: string;
    loop?: boolean;
}> = ({ width = '128', height = '128', loop = false }) => {
    return <TonkeeperLogoLottieIcon width={width} height={height} loop={loop} />;
};

export default TonkeeperIcon;
