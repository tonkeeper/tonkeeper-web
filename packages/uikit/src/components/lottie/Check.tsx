import Lottie from 'react-lottie';
import animationCheckData from './Check.json';

const defaultCheckOptions = {
    loop: false,
    autoplay: true,
    animationData: animationCheckData,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
    }
};

const Check = () => {
    return <Lottie options={defaultCheckOptions} height={160} width={160} />;
};

export default Check;
