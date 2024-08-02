import { useCallback, useRef, useState } from 'react';
import { useEventListener } from './useEventListener';

export const useIsHovered = <T extends HTMLElement = HTMLElement>() => {
    const [isHovered, setIsHovered] = useState(false);
    const ref = useRef<T | null>(null);

    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);

    useEventListener('mouseenter', handleMouseEnter, ref);
    useEventListener('mouseleave', handleMouseLeave, ref);

    return { isHovered, ref };
};
