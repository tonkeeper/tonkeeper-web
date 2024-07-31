export function getUserDesktopOS() {
    if (navigator.userAgent.includes('Win')) {
        return 'windows';
    }
    if (navigator.userAgent.includes('Mac')) {
        return 'mac';
    }
    if (navigator.userAgent.includes('Linux')) {
        return 'linux';
    }

    return undefined;
}
