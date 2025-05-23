import animationCheckData from './Check.json';
import { Lottie } from './Lottie';

const defaultCheckOptions = {
    loop: false,
    autoplay: true,
    animationData: animationCheckData,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
    }
};

const Check = () => {
    return <Lottie {...defaultCheckOptions} height={160} width={160} />;
};

export default Check;
