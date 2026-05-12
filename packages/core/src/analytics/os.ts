/**
 * Detects the user's OS for the `osName` analytics property. Prefers the modern
 * `navigator.userAgentData.platform` (Chromium-based browsers), which returns
 * exactly the values the legacy custom Aptabase client used to send ('macOS',
 * 'Windows', 'Linux', 'Android'). Falls back to parsing `navigator.userAgent`
 * for Safari/iOS and older browsers.
 *
 * Returns undefined when no detection is possible (non-browser environments).
 */
export const getOsName = (): string | undefined => {
    if (typeof navigator === 'undefined') return undefined;

    const uaData = (navigator as { userAgentData?: { platform?: string } }).userAgentData;
    if (uaData?.platform) return uaData.platform;

    const ua = navigator.userAgent ?? '';
    if (/iPad|iPhone|iPod/.test(ua)) return 'iOS';
    if (/Macintosh|Mac OS X/.test(ua)) return 'macOS';
    if (/Windows/.test(ua)) return 'Windows';
    if (/Android/.test(ua)) return 'Android';
    if (/Linux|X11/.test(ua)) return 'Linux';
    return undefined;
};
