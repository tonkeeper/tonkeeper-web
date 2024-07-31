export function getUserOS() {
    if (navigator.userAgent.includes('Win')) {
        return 'windows';
    }
    if (navigator.userAgent.includes('Mac')) {
        return 'mac';
    }
    if (navigator.userAgent.includes('Linux')) {
        return 'linux';
    }
    if (navigator.userAgent.includes('Android')) {
        return 'android';
    }
    if (
        navigator.userAgent.includes('iPhone') ||
        navigator.userAgent.includes('iPad') ||
        navigator.userAgent.includes('iPod')
    ) {
        return 'ios';
    }

    return undefined;
}
