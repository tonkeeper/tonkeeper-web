import { Asset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { useEffect } from 'react';
import { useAppContext } from '../../../hooks/appContext';
import { getTextWidth } from '../../../hooks/textWidth';
import { InputSize } from '../Sentence';

export const useButtonPosition = (
    ref: React.RefObject<HTMLDivElement>,
    blockRef: React.RefObject<HTMLLabelElement>
) => {
    const { ios, standalone } = useAppContext();
    useEffect(() => {
        if (!ios) return;

        const height = window.innerHeight;

        function resizeHandler(this: VisualViewport) {
            const button = ref.current;
            if (!button) return;
            const value = height - this.height + 16;
            const bottom = standalone ? Math.max(32, value) : value;
            button.style.bottom = `${bottom}px`;

            const labelHeight = Math.min(
                this.height - 16 - 56 - 16 - 36 - 16 - 16 - 16 - 16 - 37,
                272
            );

            if (blockRef.current) {
                blockRef.current.style.height = `${labelHeight}px`;
            }
        }

        function blurHandler() {
            const viewport = window.visualViewport;
            if (viewport) {
                viewport.removeEventListener('resize', resizeHandler);
            }
            setTimeout(() => {
                const button = ref.current;
                if (!button) return;
                button.style.bottom = null!;
            });
        }

        const viewport = window.visualViewport;
        if (viewport) {
            setTimeout(() => resizeHandler.call(viewport), 300);
            viewport.addEventListener('resize', resizeHandler);
        }

        return () => {
            blurHandler();
        };
    }, [ref.current, blockRef.current]);
};

export const defaultSize: InputSize = { size: 40, width: 30 };

export const getInputSize = (value: string, parent: HTMLLabelElement) => {
    const max = parent.clientWidth;
    let size = defaultSize.size;
    let width = getTextWidth(value, `600 ${size}px 'Montserrat'`);
    while (Math.round(width) > max - 115) {
        size = Math.max(1, size - 1);
        width = getTextWidth(value, `600 ${size}px 'Montserrat'`);
    }

    return {
        width: Math.max(Math.round(width) + 5, value.length * 6, 30),
        size: size
    };
};

export const useAutoFocusOnChange = (ref: React.RefObject<HTMLInputElement>, token: Asset) => {
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (ref.current) {
                ref.current.focus();
            }
        }, 300);
        return () => {
            clearTimeout(timeout);
        };
    }, [ref.current, token]);
};
