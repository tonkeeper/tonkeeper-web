import animationGearData from './Gear.json';
import Lottie from 'react-lottie';

const defaultGearOptions = {
    loop: false,
    autoplay: true,
    animationData: animationGearData,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
    }
};

const Gear = () => {
    return <Lottie options={defaultGearOptions} height={160} width={160} />;
};

export default Gear;
