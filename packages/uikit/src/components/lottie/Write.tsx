import animationWriteData from './Write.json';
import Lottie from 'react-lottie';

const defaultWriteOptions = {
    loop: false,
    autoplay: true,
    animationData: animationWriteData,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
    }
};

const WriteLottieIcon = () => {
    return <Lottie options={defaultWriteOptions} height={160} width={160} />;
};

export default WriteLottieIcon;
