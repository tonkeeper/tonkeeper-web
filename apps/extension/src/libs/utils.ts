import browser from 'webextension-polyfill';

/**
 * Returns an Error if extension.runtime.lastError is present
 * this is a workaround for the non-standard error object that's used
 *
 * @returns {Error|undefined}
 */
export function checkForError(): Error | undefined {
    const { lastError } = browser.runtime;
    if (!lastError) return undefined;

    return lastError instanceof Error
        ? lastError
        : new Error(lastError.message || 'Unknown runtime error');
}
