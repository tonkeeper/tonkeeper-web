import { FC, ReactNode } from 'react';
import BigNumber from 'bignumber.js';

import { PoolImplementation, PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { BRAND_CONFIG } from '@tonkeeper/core/dist/config/brand';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import {
    formatAmount,
    formatCompact,
    formatPercent
} from '@tonkeeper/core/dist/utils/numberFormat';

import { cn } from '../../../../libs/css';
import { useIsSkeleton, useSkeletonMask } from '../../../../primitives';
import { useAppSdk } from '../../../../hooks/appSdk';
import { useTranslation } from '../../../../hooks/translation';
import { getStakingPoolProvider } from '../../../../state/staking/poolBranding';
import { STAKING_PROVIDER_ICON_URLS } from '../../../../components/staking/StakingProviderIcons';
import IcGlobe16 from '../../../../icons/components/IcGlobe16';
import IcMagnifyingGlass16 from '../../../../icons/components/IcMagnifyingGlass16';
import IcTelegram16 from '../../../../icons/components/IcTelegram16';
import IcTwitter16 from '../../../../icons/components/IcTwitter16';
import { TokenImage } from '../TokenImage';

export const formatApy = (apy: number | undefined): string => `≈ ${formatPercent(apy ?? 0)}`;

export const formatCoinAmount = (value: number | BigNumber): string =>
    `${formatAmount(new BigNumber(value))} ${BRAND_CONFIG.coinSymbol}`;

export const stakingPoolProviderIconUrl = (pool: PoolInfo | undefined): string | undefined => {
    const provider = getStakingPoolProvider(pool);
    return provider ? STAKING_PROVIDER_ICON_URLS[provider] : undefined;
};

/** Round provider logo (Tonstakers / Bemo / Whales / Nominators branding). */
export const StakingPoolLogo: FC<{ pool: PoolInfo | undefined; className?: string }> = ({
    pool,
    className
}) => <TokenImage src={stakingPoolProviderIconUrl(pool)} className={className} />;

/**
 * TON coin icon with the pool's provider logo as a bottom-right badge —
 * the "staked position" glyph from the mockups (home staked rows and the
 * position page hero).
 */
export const StakingPositionIcon: FC<{
    pool: PoolInfo | undefined;
    className?: string;
    badgeClassName?: string;
}> = ({ pool, className, badgeClassName }) => {
    // The loading mockup reduces the avatar to a bare circle — no badge,
    // and no badge ring painting as a stray border around the mask bar.
    const isSkeleton = useIsSkeleton();
    return (
        <div className={cn('relative shrink-0', className)}>
            <TokenImage src={TON_ASSET.image} className="size-full" />
            {!isSkeleton && (
                <TokenImage
                    src={stakingPoolProviderIconUrl(pool)}
                    className={cn(
                        'absolute -bottom-0.5 -right-0.5 size-5 ring-2 ring-backgroundPage',
                        badgeClassName
                    )}
                />
            )}
        </div>
    );
};

/** Small green accent tag ("MAX APY" / "MAX") from the design library. */
export const AccentTag: FC<{ children: ReactNode; className?: string }> = ({
    children,
    className
}) => (
    <span
        className={cn(
            'inline-flex shrink-0 items-center rounded-extraExtraSmall px-[5px] py-0.5',
            'bg-[color-mix(in_srgb,var(--tk-accent-green)_16%,transparent)]',
            'text-[10px] font-semibold uppercase leading-[14px] text-accentGreen',
            className
        )}
    >
        {children}
    </span>
);

export interface StakingPoolLink {
    url: string;
    label: string;
    icon: ReactNode;
}

const hostnameOf = (url: string): string => {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
};

/**
 * Links shown on the pool detail and position screens: the provider site,
 * its socials (from the tonapi implementation metadata), and the pool's
 * tonviewer page.
 */
export const stakingPoolLinks = (
    pool: PoolInfo | undefined,
    implementation: PoolImplementation | undefined
): StakingPoolLink[] => {
    const links: StakingPoolLink[] = [];
    const push = (url: string) => {
        if (links.some(l => l.url === url)) return;
        const host = hostnameOf(url);
        if (host.includes('twitter.com') || host === 'x.com') {
            links.push({ url, label: 'Twitter', icon: <IcTwitter16 className="size-4" /> });
        } else if (host === 't.me' || host.includes('telegram')) {
            links.push({ url, label: 'Community', icon: <IcTelegram16 className="size-4" /> });
        } else {
            links.push({ url, label: host, icon: <IcGlobe16 className="size-4" /> });
        }
    };
    if (implementation?.url) push(implementation.url);
    implementation?.socials?.forEach(push);
    if (pool) {
        links.push({
            url: `https://tonviewer.com/${pool.address}`,
            label: 'tonviewer.com',
            icon: <IcMagnifyingGlass16 className="size-4" />
        });
    }
    return links;
};

/** "Links" section title + chip row, wrapping to multiple lines. */
export const StakingLinksSection: FC<{ links: StakingPoolLink[]; className?: string }> = ({
    links,
    className
}) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    if (links.length === 0) return null;
    return (
        <section className={className}>
            <h3 className="py-3.5 text-h3 text-textPrimary">{t('staking_links_title')}</h3>
            <div className="flex flex-wrap gap-2">
                {links.map(link => (
                    <button
                        key={link.url}
                        type="button"
                        onClick={() => sdk.openPage(link.url)}
                        className="flex items-center gap-2 rounded-full bg-buttonSecondaryBackground px-4 py-2 text-label2 text-buttonSecondaryForeground transition-colors hover:bg-buttonSecondaryBackgroundHighlighted"
                    >
                        {link.icon}
                        {link.label}
                    </button>
                ))}
            </div>
        </section>
    );
};

/** APY (+ optional MAX tag) / minimal-deposit info card. */
export const StakingInfoCard: FC<{
    /** `undefined` while the pool loads — values mask, labels stay live. */
    pool?: PoolInfo;
    showMaxApyTag?: boolean;
    className?: string;
}> = ({ pool, showMaxApyTag, className }) => {
    const { t } = useTranslation();
    const mask = useSkeletonMask(!pool);
    return (
        <div
            className={cn(
                'rounded-medium bg-backgroundContent py-2 [--tk-skeleton-fill:var(--tk-background-content-tint)]',
                className
            )}
        >
            <div className="flex items-start gap-2 px-4 py-2">
                <span className="flex items-center gap-1.5 text-body2 text-textSecondary">
                    {t('staking_confirm_modal_apy')}
                    {showMaxApyTag && <AccentTag>{t('staking_max')}</AccentTag>}
                </span>
                <span
                    {...mask({ w: 41 })}
                    className="flex-1 text-right text-body2 text-textPrimary"
                >
                    {pool ? formatApy(pool.apy) : '0'}
                </span>
            </div>
            <div className="flex items-start gap-2 px-4 py-2">
                <span className="text-body2 text-textSecondary">
                    {t('staking_min_deposit_label')}
                </span>
                <span
                    {...mask({ w: 41 })}
                    className="flex-1 text-right text-body2 text-textPrimary"
                >
                    {pool ? `${formatMinStake(pool.minStake)} ${BRAND_CONFIG.coinSymbol}` : '0'}
                </span>
            </div>
        </div>
    );
};

/** Third-party smart-contract disclaimer shown under the pool info card. */
export const StakingDisclaimer: FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    return (
        <p className={cn('px-4 pb-4 pt-3 text-body3 text-textTertiary', className)}>
            {t('staking_tonstakers_notice')}
        </p>
    );
};

export const formatMinStake = (minStake: number): string => {
    return formatAmount(shiftedDecimals(minStake));
};

/** Abbreviated form for the pool-group summary rows ("10K TON"). */
export const formatMinStakeCompact = (minStake: number): string =>
    formatCompact(shiftedDecimals(minStake));
