import { FC } from 'react';

import {
    BrowserApp,
    BrowserCategory,
    CATEGORY_DESKTOP_ROW_SIZE,
    CATEGORY_ROW_SIZE,
    categoryExploreApps
} from '@tonkeeper/core/dist/service/browserCatalogService';

import { cn } from '../../../../libs/css';
import { useTranslation } from '../../../../hooks/translation';
import { ListTitle } from '../ListTitle';
import { BrowserServiceCard } from './BrowserServiceCard';

/**
 * Untitled icon row of app cards (the services row and the category
 * sections). The tile is a fixed 88px, so the row lays the tiles out on a
 * fixed track template and spreads the leftover width between the tracks —
 * every row then shares one column rhythm, including an under-filled last
 * row. The desktop column fits five tiles (Figma 340:89200), the narrower
 * mobile column four.
 */
export const BrowserAppsGrid: FC<{
    apps: Pick<BrowserApp, 'id' | 'name' | 'icon' | 'chains'>[];
    onOpenApp: (index: number) => void;
    compact?: boolean;
}> = ({ apps, onOpenApp, compact = false }) => (
    <div
        className={cn(
            '-mx-1 grid',
            compact
                ? 'grid-cols-[repeat(5,88px)] justify-between'
                : 'grid-cols-4 justify-items-center'
        )}
    >
        {apps.map((app, index) => (
            <BrowserServiceCard key={app.id} app={app} onClick={() => onOpenApp(index)} />
        ))}
    </div>
);

/**
 * Figma "Section": List Title row with a trailing accent "See All", then up
 * to two rows of service cards ({@link categoryExploreApps} decides how many
 * make the cut before "See All").
 */
export const BrowserCategorySection: FC<{
    category: BrowserCategory;
    onSeeAll: () => void;
    onOpenApp: (app: BrowserApp) => void;
    compact?: boolean;
}> = ({ category, onSeeAll, onOpenApp, compact = false }) => {
    const { t } = useTranslation();
    const visible = categoryExploreApps(
        category.apps,
        compact ? CATEGORY_DESKTOP_ROW_SIZE : CATEGORY_ROW_SIZE
    );

    return (
        <section className="flex flex-col">
            <ListTitle
                title={category.title}
                right={
                    <button
                        type="button"
                        onClick={onSeeAll}
                        className="cursor-pointer text-body2 text-textAccent transition-opacity duration-100 hover:opacity-80"
                    >
                        {t('browser_see_all')}
                    </button>
                }
            />
            <BrowserAppsGrid
                apps={visible}
                onOpenApp={index => onOpenApp(visible[index])}
                compact={compact}
            />
        </section>
    );
};
