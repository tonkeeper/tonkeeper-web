import { RefObject, useMemo } from 'react';

export type useTextWidthTextOptions = {
    text: string | string[] | undefined;
    font?: string;
};

export type useTextWidthRefOptions = {
    ref: RefObject<Element>;
};

export interface useTextWidthType {
    (options: useTextWidthTextOptions | useTextWidthRefOptions): number;
}

const getContext = () => {
    const fragment: DocumentFragment = document.createDocumentFragment();
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    fragment.appendChild(canvas);
    return canvas.getContext('2d') as CanvasRenderingContext2D;
};

/*
 * The family list callers should measure with. Reads `--tk-font-sans` off the
 * root element because the Vietnamese locale swaps the whole UI to Inter —
 * a hardcoded 'TT Firs Neue' would run the auto-shrink maths against a face
 * nobody sees.
 */
export const getUiFontFamily = () => {
    const stack = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--tk-font-sans');
    return stack.trim() || "'TT Firs Neue', sans-serif";
};

export const getTextWidth = (currentText: string | string[], font: string) => {
    const context = getContext();
    context.font = font;

    if (Array.isArray(currentText)) {
        return Math.max(...currentText.map(t => context.measureText(t).width));
    } else {
        const metrics = context.measureText(currentText);
        return metrics.width;
    }
};

const useTextWidth: useTextWidthType = options => {
    const textOptions = useMemo(() => ('text' in options ? options : undefined), [options]);
    const refOptions = useMemo(() => ('ref' in options ? options : undefined), [options]);

    return useMemo(() => {
        if (refOptions?.ref.current?.textContent) {
            const context = getContext();
            const computedStyles = window.getComputedStyle(refOptions.ref.current);
            context.font = computedStyles.font;
            const metrics = context.measureText(refOptions.ref.current.textContent);

            return metrics.width;
        } else if (textOptions?.text) {
            return getTextWidth(textOptions.text, textOptions.font ?? '16px times');
        }

        return NaN;
    }, [textOptions?.text, textOptions?.font, refOptions?.ref]);
};

export default useTextWidth;
