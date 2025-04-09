import { FC } from 'react';
import Lottie from 'react-lottie';
import animationConfettiData from './Confetti.json';

const defaultConfettiOptions = {
    loop: false,
    autoplay: true,
    animationData: animationConfettiData,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
    }
};

const ConfettiLottieIcon: FC<{ width: number; height: number }> = ({ width, height }) => {
    return <Lottie options={defaultConfettiOptions} height={height} width={width} />;
};

export default ConfettiLottieIcon;
