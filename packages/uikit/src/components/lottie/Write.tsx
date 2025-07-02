import animationWriteData from './Write.json';
import { Lottie } from './Lottie';

const defaultWriteOptions = {
    loop: false,
    autoplay: true,
    animationData: animationWriteData,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
    }
};

const WriteLottieIcon = () => {
    return <Lottie {...defaultWriteOptions} height={160} width={160} />;
};

export default WriteLottieIcon;
