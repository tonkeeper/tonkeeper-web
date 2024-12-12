import { useCallback, useRef, useState } from 'react';
import { useEventListener } from './useEventListener';
import { isTouchDevice } from '../libs/web';

const isTouchScreen = isTouchDevice();

export const useIsHovered = <T extends HTMLElement = HTMLElement>() => {
    const [isHovered, setIsHovered] = useState(false);
    const ref = useRef<T | null>(null);

    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);

    useEventListener(
        ...((isTouchScreen ? [] : ['mouseenter', handleMouseEnter, ref]) as Parameters<
            typeof useEventListener
        >)
    );
    useEventListener(
        ...((isTouchScreen ? [] : ['mouseleave', handleMouseLeave, ref]) as Parameters<
            typeof useEventListener
        >)
    );

    return { isHovered, ref };
};
