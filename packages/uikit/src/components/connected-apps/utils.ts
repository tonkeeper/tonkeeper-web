export function formatDappUrl(dappUrl?: string) {
    if (!dappUrl) {
        return '';
    }
    return dappUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
}
