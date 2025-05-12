import { useState, useEffect, useRef } from 'react';
import { ForTargetEnv } from '../components/shared/TargetEnv';

export const useElementHeight = () => {
    const ref = useRef(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (!ref.current) return;

        const observer = new ResizeObserver(([entry]) => {
            if (entry) {
                setHeight(entry.contentRect.height);
            }
        });

        observer.observe(ref.current);

        return () => {
            observer.disconnect();
        };
    }, []);

    return { ref, height };
};

export const useMobileModalFullScreenStretcher = () => {
    const { ref, height } = useElementHeight();

    const modalGapHeightPx = 20;
    const modalHeaderHeightPx = 44;
    const modalFooterPaddingHeightPx = 16;

    return {
        ref,
        stretcher: (
            <ForTargetEnv env="mobile">
                <div
                    style={{
                        height: `calc(100vh - ${
                            height +
                            modalGapHeightPx +
                            modalHeaderHeightPx +
                            modalFooterPaddingHeightPx +
                            1
                        }px - env(safe-area-inset-top))`
                    }}
                />
            </ForTargetEnv>
        )
    };
};
