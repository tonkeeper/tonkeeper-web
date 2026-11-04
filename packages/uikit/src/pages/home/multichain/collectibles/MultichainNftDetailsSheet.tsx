import { FC, ReactNode, useState } from 'react';

import { NFT, NFTDNS, isNFTDNS } from '@tonkeeper/core/dist/entries/nft';
import { formatAddress, seeIfAddressEqual, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { isTONDNSDomain } from '@tonkeeper/core/dist/utils/nft';

import { Button, Link } from '../../../../primitives';
import { Modal } from '../../../../primitives/Modal';
import { cn } from '../../../../libs/css';
import { useAppSdk } from '../../../../hooks/appSdk';
import { useTranslation } from '../../../../hooks/translation';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { MultichainRoute } from '../../../../libs/routes';
import { useDateFormat } from '../../../../hooks/dateFormat';
import {
    useHideNft,
    useIsUnverifiedNft,
    useMarkNftAsSpam,
    useNftDNSExpirationDate
} from '../../../../state/nft';
import { useActiveConfig, useActiveTonNetwork, useActiveWallet } from '../../../../state/wallet';
import IcLinkSmall16 from '../../../../icons/components/IcLinkSmall16';
import IcVerification16 from '../../../../icons/components/IcVerification16';
import IcChevronDown16 from '../../../../icons/components/IcChevronDown16';
import { MultichainNftLinkSection } from './MultichainNftLinkSection';
import { MultichainNftRenewSection } from './MultichainNftRenewSection';
import { MultichainNftMenu } from './MultichainNftMenu';
import { MultichainNftTransferSheet } from './MultichainNftTransferSheet';
import { tonDnsManageUrl } from './nft-utils';

/**
 * Two-line-clamped copy with a trailing accent "More" toggle, per the
 * mockup's Description block. Expansion is per-sheet-instance state; it
 * resets when the sheet remounts for another NFT.
 */
const ExpandableText: FC<{ text: string; className?: string }> = ({ text, className }) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    // The "More" toggle is shown from a length heuristic rather than
    // measuring overflow — measuring needs a layout pass and the cost of a
    // false positive is just a toggle that expands nothing.
    const clamps = text.length > 100;
    return (
        <div className={className}>
            <span className={cn('whitespace-pre-line', !expanded && 'line-clamp-2')}>{text}</span>
            {clamps && !expanded && (
                <Link onClick={() => setExpanded(true)} className="text-body2 text-textAccent">
                    {t('wallet_asset_more')}
                </Link>
            )}
        </div>
    );
};

const DetailsCell: FC<{
    label: string;
    value: ReactNode;
    onClick?: () => void;
    last?: boolean;
}> = ({ label, value, onClick, last }) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'flex h-14 w-full items-center justify-between gap-4 px-4 text-left',
            !last && 'border-b border-separatorCommon'
        )}
    >
        <span className="shrink-0 text-body2 text-textSecondary">{label}</span>
        <span className="truncate text-label2 text-textPrimary">{value}</span>
    </button>
);

/** Details row with the domain's on-chain expiry; absent until tonapi answers. */
const DnsExpirationCell: FC<{ nft: NFTDNS }> = ({ nft }) => {
    const { t } = useTranslation();
    const { data: expirationDate } = useNftDNSExpirationDate(nft);
    const formatted = useDateFormat(expirationDate, {
        year: 'numeric',
        hour: undefined,
        minute: undefined
    });
    if (!expirationDate) return null;
    return <DetailsCell label={t('expiration_date')} value={formatted} />;
};

/**
 * NFT details sheet for multichain accounts: hero image, name / collection /
 * description, About collection, the action stack (Transfer for every item;
 * Link, Renew and Manage for .ton domains), spam reporting for unverified
 * items, and on-chain details with an explorer link. Actions are disabled
 * while the item is on sale or owned by another address.
 */
export const MultichainNftDetailsSheet: FC<{
    nft?: NFT;
    isOpen: boolean;
    onClose: () => void;
}> = ({ nft, isOpen, onClose }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const navigate = useNavigate();
    const config = useActiveConfig();
    const network = useActiveTonNetwork();
    const wallet = useActiveWallet();
    const isUnverified = useIsUnverifiedNft(nft);
    const { mutate: markAsSpam, isLoading: isMarkingSpam } = useMarkNftAsSpam();
    const { mutate: hideNft } = useHideNft();
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [isBurnOpen, setIsBurnOpen] = useState(false);

    if (!nft) {
        return null;
    }

    const isOwner = seeIfAddressEqual(wallet.rawAddress, nft.owner?.address);
    const actionsDisabled = nft.sale !== undefined || !isOwner;
    const isTonDomain = isNFTDNS(nft) && isTONDNSDomain(nft.dns);

    const image =
        nft.previews?.find(p => p.resolution === '500x500')?.url ?? nft.previews?.[0]?.url;
    const name = nft.metadata?.name ?? toShortValue(formatAddress(nft.address, network, true));
    const description =
        typeof nft.metadata?.description === 'string' ? nft.metadata.description : undefined;
    const collectionDescription = nft.collection?.description;
    const attributes: { trait_type: string; value: string }[] = Array.isArray(
        nft.metadata?.attributes
    )
        ? nft.metadata.attributes.filter(
              (a: unknown): a is { trait_type: string; value: string } =>
                  !!a && typeof a === 'object' && 'trait_type' in a && 'value' in a
          )
        : [];

    const contractAddress = formatAddress(nft.address, network, true);
    const ownerAddress = nft.owner?.address ? formatAddress(nft.owner.address, network) : undefined;

    const onReportSpam = () =>
        markAsSpam(nft.collection ? { address: nft.address, collection: nft.collection } : nft, {
            onSuccess: onClose
        });
    const viewOnExplorer = () =>
        sdk.openPage(config.NFTOnExplorerUrl.replace('%s', contractAddress));
    const onHide = () =>
        hideNft(nft.collection ? { address: nft.address, collection: nft.collection } : nft, {
            onSuccess: onClose
        });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            variant="content"
            topBarTitle={name}
            hideCloseButton
            topBarLeft={
                <button
                    type="button"
                    aria-label={t('close')}
                    onClick={onClose}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-medium bg-buttonSecondaryBackground text-buttonSecondaryForeground transition-colors duration-100 hover:bg-buttonSecondaryBackgroundHighlighted"
                >
                    <IcChevronDown16 className="size-4" />
                </button>
            }
            topBarRight={
                <MultichainNftMenu
                    hideCollection={nft.collection !== undefined}
                    canBurn={!actionsDisabled}
                    onHide={onHide}
                    onViewOnExplorer={viewOnExplorer}
                    onBurn={() => setIsBurnOpen(true)}
                />
            }
        >
            {/* The Modal body already carries the sheet's 16px side/bottom padding. */}
            <div className="flex flex-col gap-4">
                <div className="overflow-hidden rounded-medium bg-backgroundContent">
                    <div className="relative aspect-square w-full bg-backgroundContentTint">
                        {image && (
                            <img
                                src={image}
                                alt={name}
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                        )}
                    </div>
                    <div className="flex flex-col px-4 py-3.5">
                        <div className="flex items-center gap-2">
                            <span className="truncate text-h2 text-textPrimary">{name}</span>
                            {nft.sale !== undefined && (
                                <span className="shrink-0 rounded-full bg-backgroundContentTint px-1.5 py-1 text-body4Caps uppercase text-textSecondary">
                                    {t('nft_on_sale')}
                                </span>
                            )}
                        </div>
                        {nft.collection?.name && (
                            <div className="flex items-center gap-1 text-body2 text-textSecondary">
                                <span className="truncate">{nft.collection.name}</span>
                                {nft.trust === 'whitelist' && (
                                    <IcVerification16 className="size-4 shrink-0" />
                                )}
                            </div>
                        )}
                        {description && (
                            <ExpandableText
                                text={description}
                                className="mt-2 text-body2 text-textSecondary"
                            />
                        )}
                    </div>
                    {collectionDescription && (
                        <div className="border-t border-separatorCommon px-4 py-3.5">
                            <div className="pb-2 text-label1 text-textPrimary">
                                {t('nft_about_collection')}
                            </div>
                            <ExpandableText
                                text={collectionDescription}
                                className="text-body2 text-textSecondary"
                            />
                        </div>
                    )}
                </div>

                <Button
                    variant="primaryBlue"
                    size="large"
                    fullWidth
                    disabled={actionsDisabled}
                    onClick={() => setIsTransferOpen(true)}
                >
                    {t('nft_transfer_nft')}
                </Button>
                {isNFTDNS(nft) && (
                    <>
                        <MultichainNftLinkSection nft={nft} />
                        <MultichainNftRenewSection nft={nft} />
                        {isTonDomain && (
                            <Button
                                variant="primaryGreen"
                                size="large"
                                fullWidth
                                rightIcon={<IcLinkSmall16 />}
                                onClick={() => sdk.openPage(tonDnsManageUrl(nft.dns))}
                            >
                                {t('multichain_nft_manage')}
                            </Button>
                        )}
                    </>
                )}

                {isUnverified && (
                    <Button
                        variant="secondary"
                        size="large"
                        fullWidth
                        loading={isMarkingSpam}
                        onClick={onReportSpam}
                    >
                        <span className="text-accentOrange">{t('multichain_nft_report_spam')}</span>
                    </Button>
                )}

                {attributes.length > 0 && (
                    <section>
                        <div className="py-3 text-h3 text-textPrimary">
                            {t('multichain_nft_properties')}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {attributes.map(attr => (
                                <div
                                    key={`${attr.trait_type}-${attr.value}`}
                                    className="flex flex-col rounded-medium bg-backgroundContent px-3 py-2"
                                >
                                    <span className="text-body3 text-textSecondary">
                                        {attr.trait_type}
                                    </span>
                                    <span className="text-label2 text-textPrimary">
                                        {attr.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex items-center justify-between py-3">
                        <span className="text-h3 text-textPrimary">{t('nft_details')}</span>
                        <Link onClick={viewOnExplorer}>{t('nft_view_in_explorer')}</Link>
                    </div>
                    <div className="overflow-hidden rounded-medium bg-backgroundContent">
                        {ownerAddress && (
                            <DetailsCell
                                label={t('nft_owner_address')}
                                value={toShortValue(ownerAddress)}
                                onClick={() => sdk.copyToClipboard(ownerAddress, t('copied'))}
                            />
                        )}
                        {isTonDomain && <DnsExpirationCell nft={nft} />}
                        <DetailsCell
                            label={t('nft_contract_address')}
                            value={toShortValue(contractAddress)}
                            onClick={() => sdk.copyToClipboard(contractAddress, t('copied'))}
                            last
                        />
                    </div>
                </section>
            </div>
            <MultichainNftTransferSheet
                nft={nft}
                isOpen={isTransferOpen}
                onClose={transferred => {
                    setIsTransferOpen(false);
                    if (transferred) {
                        onClose();
                        navigate(MultichainRoute.history);
                    }
                }}
            />
            <MultichainNftTransferSheet
                nft={nft}
                mode="burn"
                isOpen={isBurnOpen}
                onClose={burned => {
                    setIsBurnOpen(false);
                    if (burned) {
                        onClose();
                        navigate(MultichainRoute.history);
                    }
                }}
            />
        </Modal>
    );
};
