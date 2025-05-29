import animationGearData from './Gear.json';
import { Lottie } from './Lottie';

const defaultGearOptions = {
    loop: false,
    autoplay: true,
    animationData: animationGearData,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
    }
};

const Gear = () => {
    return <Lottie {...defaultGearOptions} height={160} width={160} />;
};

export default Gear;
