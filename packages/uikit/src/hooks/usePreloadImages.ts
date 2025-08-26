import { useEffect } from 'react';

export function usePreloadImages(srcArray: string[]) {
    useEffect(() => {
        if (!srcArray?.length) return;

        const images = srcArray.map(src => {
            const img = new Image();

            img.decoding = 'async';
            img.loading = 'eager';
            img.src = src;

            return img;
        });

        return () => {
            images.forEach(img => {
                img.src = '';
            });
        };
    }, [JSON.stringify(srcArray)]);
}
