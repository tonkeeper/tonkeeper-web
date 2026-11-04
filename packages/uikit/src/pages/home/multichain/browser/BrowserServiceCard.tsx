import { FC } from 'react';

import {
    BrowserApp,
    browserAppBadgeChain
} from '@tonkeeper/core/dist/service/browserCatalogService';

import { ChainBadgeOverlay, useIsSkeleton, useSkeletonMask } from '../../../../primitives';
import { networkIcon } from '../multichain-utils';

/**
 * Figma "Service Card Medium": 64px app icon on the content surface with a
 * chain badge at the bottom-right corner and a single-line caption.
 */
export const BrowserServiceCard: FC<{
    app: Pick<BrowserApp, 'name' | 'icon' | 'chains'>;
    onClick: () => void;
}> = ({ app, onClick }) => {
    const isSkeleton = useIsSkeleton();
    const mask = useSkeletonMask();
    const badgeChain = browserAppBadgeChain(app);

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isSkeleton}
            className="flex w-[88px] cursor-pointer flex-col items-center gap-2 px-0.5 py-2 transition-opacity duration-100 hover:enabled:opacity-80 disabled:cursor-default"
        >
            <ChainBadgeOverlay
                icon={badgeChain !== undefined && !isSkeleton ? networkIcon(badgeChain) : undefined}
            >
                <span
                    {...mask({ w: 64, h: 64, r: 16 })}
                    className="flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-backgroundContent"
                >
                    {!isSkeleton && (
                        <img
                            src={app.icon}
                            alt=""
                            loading="lazy"
                            className="size-16 object-cover"
                        />
                    )}
                </span>
            </ChainBadgeOverlay>
            <span
                {...mask({ w: 40 })}
                className="w-full truncate text-center text-body3 text-textSecondary"
            >
                {app.name}
            </span>
        </button>
    );
};
