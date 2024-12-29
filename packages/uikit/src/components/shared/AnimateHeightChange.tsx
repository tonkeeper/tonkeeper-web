import { motion } from 'framer-motion';
import React, { FC, useEffect, useRef, useState } from 'react';

export const AnimateHeightChange: FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [height, setHeight] = useState<number | 'auto'>('auto');

    useEffect(() => {
        if (containerRef.current) {
            const resizeObserver = new ResizeObserver(entries => {
                const observedHeight = entries[0].contentRect.height;
                setHeight(observedHeight);
            });

            resizeObserver.observe(containerRef.current);

            return () => {
                // Cleanup the observer when the component is unmounted
                resizeObserver.disconnect();
            };
        }
    }, []);

    return (
        <motion.div
            className={'overflow-hidden'}
            style={{ height }}
            animate={{ height }}
            transition={{ duration: 0.2 }}
        >
            <div ref={containerRef}>{children}</div>
        </motion.div>
    );
};
