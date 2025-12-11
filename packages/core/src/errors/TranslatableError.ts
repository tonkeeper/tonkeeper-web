export type TranslateFunction = (text: string, replaces?: Record<string, string | number>) => string;

export interface TranslatableError {
    translate?: string | ((t: TranslateFunction) => string);
}

export const getErrorText = (
    e: unknown,
    options: { t: TranslateFunction; defaultError?: string }
): string => {
    const { t, defaultError } = options;
    const defaultErrorText = defaultError || t('error_occurred');
    if (typeof e === 'string') {
        return e || defaultErrorText;
    }

    if (!e || typeof e !== 'object') {
        return defaultErrorText;
    }

    if ('translate' in e) {
        if (typeof e.translate === 'string') {
            return t(e.translate);
        }

        if (typeof e.translate === 'function') {
            return e.translate(t);
        }
    }

    if (e instanceof Error) {
        return e.message || defaultErrorText;
    }

    return defaultErrorText;
};
