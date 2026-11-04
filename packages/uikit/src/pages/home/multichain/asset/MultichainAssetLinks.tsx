import { FC, ReactNode } from 'react';
import { useTranslation } from '../../../../hooks/translation';

import { AssetDetailsLinks, AssetLink } from '@tonkeeper/core/dist/service/tradingService';

import { ExternalLink } from '../../../../components/shared/ExternalLink';
import { ListTitle } from '../ListTitle';

const TelegramIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M14.94 2.62a.78.78 0 0 0-.79-.13L1.34 7.39a.78.78 0 0 0 .03 1.47l3.2 1 1.24 3.94a.78.78 0 0 0 1.3.29l1.86-1.84 3.27 2.4a.78.78 0 0 0 1.23-.48l2.2-10.86a.78.78 0 0 0-.73-.69ZM6.6 11.07l-.59-1.86 6.6-5.97-6.01 7.83Z" />
    </svg>
);

const WebsiteIcon = () => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
    >
        <circle cx="8" cy="8" r="6.25" />
        <ellipse cx="8" cy="8" rx="3" ry="6.25" />
        <line x1="1.75" y1="8" x2="14.25" y2="8" />
    </svg>
);

const XIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <path d="M10.6 1H12.7L8.18 6.16 13.5 13.2H9.3L6 8.9 2.2 13.2H0.1L4.94 7.7 0 1h4.3l2.97 3.93L10.6 1Zm-0.73 11h1.17L3.18 2.15H1.93L9.87 12Z" />
    </svg>
);

function linkIcon(type: string): ReactNode {
    if (type === 'telegram') return <TelegramIcon />;
    if (type === 'twitter') return <XIcon />;
    return <WebsiteIcon />;
}

export const MultichainAssetLinks: FC<{ links: AssetDetailsLinks }> = ({ links }) => {
    const { t } = useTranslation();
    if (!links.enabled || links.items.length === 0) return null;

    return (
        <section className="flex flex-col px-4 pb-4">
            <ListTitle title={t('wallet_asset_links')} />
            <div className="flex flex-wrap gap-2">
                {links.items.map((link: AssetLink) => (
                    <ExternalLink key={link.url} href={link.url} contents>
                        <span className="inline-flex cursor-pointer items-center gap-2 rounded-[18px] bg-buttonSecondaryBackground px-4 py-2 text-label2 text-buttonSecondaryForeground transition-colors duration-100 hover:bg-buttonSecondaryBackgroundHighlighted">
                            {linkIcon(link.type)}
                            <span>{link.name}</span>
                        </span>
                    </ExternalLink>
                ))}
            </div>
        </section>
    );
};
