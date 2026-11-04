import { FC } from 'react';

import { orderMultichainChains } from '@tonkeeper/core/dist/chains/multichain-chain-order';

import { useTranslation } from '../../../../hooks/translation';
import { useLongPress } from '../../../../hooks/useLongPress';
import IcCloseSmall16 from '../../../../icons/components/IcCloseSmall16';
import IcImagePlaceholder64 from '../../../../icons/components/IcImagePlaceholder64';
import { ChainBadgeOverlay } from '../../../../primitives';
import { networkIcon } from '../multichain-utils';

export interface ConnectedAppTileProps {
    name: string;
    icon?: string;
    /** Networks the connection covers; the first known one renders as the corner badge. */
    chains?: string[];
    onOpen: () => void;
    /** Close-pill click — pointer devices reveal the pill on hover. */
    onRequestDisconnect: () => void;
    /** Touch long-press — the shell shows the disconnect toast, as on native iOS. */
    onLongPress: () => void;
}

/**
 * Connected-apps grid cell (Figma "Service Card Medium"): 64px dApp icon
 * with a chain badge on the corner and a single-line caption. Disconnect
 * affordances split by input: hover reveals a close pill (desktop), a
 * touch long-press fires `onLongPress` (scrolling cancels it via the
 * browser's pointercancel).
 */
export const ConnectedAppTile: FC<ConnectedAppTileProps> = ({
    name,
    icon,
    chains,
    onOpen,
    onRequestDisconnect,
    onLongPress
}) => {
    const { t } = useTranslation();
    const badgeChain = orderMultichainChains(chains ?? []).find(
        chain => networkIcon(chain) !== undefined
    );

    const press = useLongPress({ onClick: onOpen, onLongPress });

    return (
        <div className="group relative flex w-[88px] flex-col items-center px-0.5 py-2">
            <button
                type="button"
                {...press}
                className="flex w-full select-none flex-col items-center gap-2 [-webkit-touch-callout:none]"
            >
                <ChainBadgeOverlay
                    icon={badgeChain !== undefined ? networkIcon(badgeChain) : undefined}
                >
                    <span className="flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-backgroundContent">
                        {icon ? (
                            <img
                                src={icon}
                                alt=""
                                loading="lazy"
                                className="pointer-events-none size-16 object-cover"
                            />
                        ) : (
                            <IcImagePlaceholder64 className="size-16 text-iconTertiary" />
                        )}
                    </span>
                </ChainBadgeOverlay>
                <span className="w-full truncate text-center text-body3 text-textSecondary">
                    {name}
                </span>
            </button>
            <button
                type="button"
                aria-label={t('disconnect')}
                onClick={onRequestDisconnect}
                className="absolute right-0 top-0 hidden rounded-2xl bg-backgroundContentTint p-1 text-textPrimary backdrop-blur-[48px] [@media(hover:hover)]:group-focus-within:flex [@media(hover:hover)]:group-hover:flex"
            >
                <IcCloseSmall16 className="size-4" />
            </button>
        </div>
    );
};
