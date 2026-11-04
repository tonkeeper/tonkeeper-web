import { FC } from 'react';
import LottieReact from 'lottie-react';

import { cn } from '../../libs/css';
import animationData from './MagnifyingGlass.json';

/** The "nothing found" placeholder mark; plays once on mount like the native placeholder. */
export const MagnifyingGlassLottie: FC<{ className?: string }> = ({ className }) => (
    <LottieReact
        animationData={animationData}
        loop={false}
        autoplay
        className={cn('size-14', className)}
    />
);
