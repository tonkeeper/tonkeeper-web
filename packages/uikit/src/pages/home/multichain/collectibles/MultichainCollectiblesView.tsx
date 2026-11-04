import { FC, useState } from 'react';

import { NFT } from '@tonkeeper/core/dist/entries/nft';

import { Button, SkeletonScope } from '../../../../primitives';
import { Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives/Modal';
import { cn } from '../../../../libs/css';
import { useTranslation } from '../../../../hooks/translation';
import { ModalCenterError } from '../../../../components/shared/ModalCenterState';
import IcExclamationmarkCircle28 from '../../../../icons/components/IcExclamationmarkCircle28';
import IcInformationCircle12 from '../../../../icons/components/IcInformationCircle12';
import IcSliders16 from '../../../../icons/components/IcSliders16';
import { BackButton } from '../../../../primitives/BackButton';
import { PLACEHOLDER_NFTS } from '../multichain-placeholders';
import { NftCardSmall } from './NftCardSmall';

export interface MultichainCollectiblesViewProps {
    /** Rendered inside the desktop shell's 520px column: 4-column grid. */
    compact?: boolean;
    /** `undefined` while the list is loading — or after it failed, see `isError`. */
    nfts: NFT[] | undefined;
    /** The list request failed with nothing loaded: a retry replaces the skeleton. */
    isError?: boolean;
    onRetry?: () => void;
    onBack: () => void;
    onOpenNft: (nft: NFT) => void;
    onOpenSettings: () => void;
}

/**
 * Collectibles gallery. TON NFTs only for now — the subtitle's info icon
 * opens a sheet explaining that other networks come later. Spam management
 * lives on the settings page behind the sliders button, not in the header.
 */
export const MultichainCollectiblesView: FC<MultichainCollectiblesViewProps> = ({
    compact = false,
    nfts,
    isError = false,
    onRetry,
    onBack,
    onOpenNft,
    onOpenSettings
}) => {
    const { t } = useTranslation();
    const [infoOpen, setInfoOpen] = useState(false);

    return (
        <div
            className={cn(
                'flex flex-col bg-backgroundPage',
                compact ? 'min-h-full' : 'min-h-screen'
            )}
        >
            <header className="relative flex h-16 shrink-0 flex-col items-center justify-center px-16">
                <BackButton onClick={onBack} className="absolute left-2 top-1/2 -translate-y-1/2" />
                <div className="text-h3 text-textPrimary">{t('wallet_collectibles')}</div>
                <button
                    type="button"
                    onClick={() => setInfoOpen(true)}
                    className="flex items-center gap-1 text-body2 text-textSecondary"
                >
                    <span>{t('multichain_collectibles_subtitle')}</span>
                    <IcInformationCircle12 className="size-3 text-iconSecondary" />
                </button>
                <button
                    type="button"
                    aria-label={t('settings_collectibles_list')}
                    onClick={onOpenSettings}
                    className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-medium bg-buttonSecondaryBackground text-buttonSecondaryForeground transition-colors duration-100 hover:bg-buttonSecondaryBackgroundHighlighted"
                >
                    <IcSliders16 className="size-4" />
                </button>
            </header>

            {!nfts && isError && (
                <div className="pt-16">
                    <ModalCenterError
                        icon={<IcExclamationmarkCircle28 />}
                        onRetry={() => onRetry?.()}
                    />
                </div>
            )}

            {!nfts && !isError && (
                <SkeletonScope loading>
                    <div
                        className={cn(
                            'grid gap-2 px-4 pb-4 pt-2',
                            compact ? 'grid-cols-4' : 'grid-cols-3'
                        )}
                    >
                        {PLACEHOLDER_NFTS.map(nft => (
                            <NftCardSmall key={nft.address} nft={nft} className="w-full" />
                        ))}
                    </div>
                </SkeletonScope>
            )}

            {nfts && nfts.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-1 px-8 py-16 text-center">
                    <div className="text-label2 text-textPrimary">
                        {t('collectibles_empty_header')}
                    </div>
                    <div className="text-body2 text-textSecondary">
                        {t('nft_empty_description')}
                    </div>
                </div>
            )}

            {nfts && nfts.length > 0 && (
                <div
                    className={cn(
                        'grid gap-2 px-4 pb-4 pt-2',
                        compact ? 'grid-cols-4' : 'grid-cols-3'
                    )}
                >
                    {nfts.map(nft => (
                        <NftCardSmall
                            key={nft.address}
                            nft={nft}
                            onClick={() => onOpenNft(nft)}
                            className="w-full"
                        />
                    ))}
                </div>
            )}

            <Modal
                isOpen={infoOpen}
                onClose={() => setInfoOpen(false)}
                heading={t('multichain_collectibles_info_title')}
                subheading={t('multichain_collectibles_info_description')}
            >
                <ModalFooterPortal>
                    <ModalFooter>
                        <Button
                            variant="primaryBlue"
                            size="large"
                            fullWidth
                            onClick={() => setInfoOpen(false)}
                        >
                            {t('multichain_collectibles_info_ok')}
                        </Button>
                    </ModalFooter>
                </ModalFooterPortal>
            </Modal>
        </div>
    );
};
