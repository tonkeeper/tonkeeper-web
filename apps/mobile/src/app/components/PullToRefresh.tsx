import styled from 'styled-components';
import { useState, useCallback, useEffect, FC } from 'react';
import { RefreshIcon } from '@tonkeeper/uikit/dist/components/Icon';

const THRESHOLD = 300;
const INITIAL_SHIFT = 4;
const SHIFT_LIMIT = 16;
const PULL_RESISTANCE_KOEF = 0.2;

export function usePullToRefresh(onRefresh: () => Promise<void>) {
    const [startY, setStartY] = useState(0);
    const [pullProgress, setPullProgress] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (window.scrollY === 0) {
            setStartY(e.touches[0].clientY);
        }
    }, []);

    const handleTouchMove = useCallback(
        (e: TouchEvent) => {
            if (startY === 0 || isRefreshing) return;

            const y = e.touches[0].clientY;
            let pull = Math.max(0, y - startY);

            if (pull < THRESHOLD) {
                pull = 0;
            } else {
                pull = Math.min(INITIAL_SHIFT + pull * PULL_RESISTANCE_KOEF, SHIFT_LIMIT);
            }

            // Prevent default scrolling while pulling
            if (pull > 0) {
                e.preventDefault();
            }

            setPullProgress(pull);
        },
        [startY, isRefreshing]
    );

    const handleTouchEnd = useCallback(async () => {
        if (pullProgress >= 1 && !isRefreshing) {
            setIsRefreshing(true);
            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
            }
        }
        setStartY(0);
        setPullProgress(0);
    }, [pullProgress, isRefreshing, onRefresh]);

    useEffect(() => {
        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return {
        pullProgress,
        isRefreshing
    };
}

export const RefreshContainer = styled.div<{ $pullProgress: number }>`
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%)
        translateY(
            ${props =>
                props.$pullProgress > 0
                    ? `calc(${props.$pullProgress}px + env(safe-area-inset-top))`
                    : '-100%'}
        );
    height: 36px;
    width: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
    z-index: 50;
    background: ${p => p.theme.buttonTertiaryBackground};
    border-radius: 50%;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.04);
`;

export const IconWrapper = styled.div<{ $rotation: number; $isRefreshing: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    transform: rotate(${props => props.$rotation}deg);
    transition: transform 0.2s;
    animation: ${props => (props.$isRefreshing ? 'spin 1s linear infinite' : 'none')};

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
`;

export const PullToRefresh: FC<{ onRefresh: () => Promise<void> }> = ({ onRefresh }) => {
    const { pullProgress, isRefreshing } = usePullToRefresh(onRefresh);
    const rotation = Math.min(pullProgress * 360, 360);

    return (
        <RefreshContainer $pullProgress={pullProgress}>
            <IconWrapper $rotation={rotation} $isRefreshing={isRefreshing}>
                <RefreshIcon />
            </IconWrapper>
        </RefreshContainer>
    );
};
