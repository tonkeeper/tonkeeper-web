import queryString from 'query-string';

export type DAppSource = 'recommendation' | 'featured';
export type DAppTrack = 'desktop' | 'extension' | 'twa';

export const formatBrowserUrl = (source: string, camp: DAppSource, track: DAppTrack): string => {
    const date = new Date();
    const stringified = queryString.stringify({
        utm_source: 'tonkeeper',
        utm_campaign:
            camp === 'recommendation'
                ? 'recom'
                : `feat-${date.getMonth() + 1}-${date.getFullYear()}`,
        utm_medium: track
    });

    const startChar = source.includes('?') ? '&' : '?';
    return `${source}${startChar}${stringified}`;
};
