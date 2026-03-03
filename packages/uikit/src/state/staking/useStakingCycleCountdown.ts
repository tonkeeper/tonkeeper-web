import { useEffect, useState } from 'react';
import { PoolInfo } from '@tonkeeper/core/dist/tonApiV2';

const formatSeconds = (totalSeconds: number): string => {
    if (totalSeconds <= 0) return '00:00:00';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
};

export const useStakingCycleCountdown = (pool: PoolInfo | undefined): string | null => {
    const [countdown, setCountdown] = useState<string | null>(null);
    const cycleEnd = pool?.cycleEnd;

    useEffect(() => {
        if (cycleEnd === undefined) {
            setCountdown(null);
            return;
        }

        let id: ReturnType<typeof setInterval> | undefined;

        const update = () => {
            const remaining = cycleEnd - Math.floor(Date.now() / 1000);
            if (remaining <= 0) {
                setCountdown('');
                if (id !== undefined) {
                    clearInterval(id);
                    id = undefined;
                }
            } else {
                setCountdown(formatSeconds(remaining));
            }
        };

        update();
        if (id === undefined) {
            id = setInterval(update, 1000);
        }
        return () => {
            if (id !== undefined) clearInterval(id);
        };
    }, [cycleEnd]);

    return countdown;
};
