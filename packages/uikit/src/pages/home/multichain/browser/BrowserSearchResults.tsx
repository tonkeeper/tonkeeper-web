import { FC } from 'react';

import { BrowserApp } from '@tonkeeper/core/dist/service/browserCatalogService';

import { useTranslation } from '../../../../hooks/translation';
import IcGlobe16 from '../../../../icons/components/IcGlobe16';
import { BrowserAppListCard, BrowserAppListRow } from './BrowserAppListRow';
import { typedUrl } from './browser-utils';

/**
 * Replaces the catalog while the search field has a query: matching apps as
 * list rows, preceded by an "open this address" row when the query reads as
 * a URL. Mirrors the native search behaviour (local catalog match + URL
 * detection) without the external search-engine suggestions.
 */
export const BrowserSearchResults: FC<{
    query: string;
    matches: BrowserApp[];
    onOpenApp: (app: BrowserApp) => void;
    onOpenUrl: (url: string) => void;
}> = ({ query, matches, onOpenApp, onOpenUrl }) => {
    const { t } = useTranslation();
    const url = typedUrl(query);

    if (url === undefined && matches.length === 0) {
        return (
            <div className="px-8 py-16 text-center text-body2 text-textSecondary">
                {t('browser_search_empty')}
            </div>
        );
    }

    return (
        <BrowserAppListCard>
            {url !== undefined && (
                <BrowserAppListRow
                    chevron={false}
                    app={{
                        name: new URL(url).hostname,
                        description: t('browser_open_link'),
                        icon: '',
                        chains: []
                    }}
                    leading={
                        <span className="flex size-11 items-center justify-center rounded-xl bg-backgroundContentTint text-textSecondary">
                            <IcGlobe16 className="size-4" />
                        </span>
                    }
                    onClick={() => onOpenUrl(url)}
                />
            )}
            {matches.map(app => (
                <BrowserAppListRow
                    key={app.id}
                    app={app}
                    chevron={false}
                    onClick={() => onOpenApp(app)}
                />
            ))}
        </BrowserAppListCard>
    );
};
