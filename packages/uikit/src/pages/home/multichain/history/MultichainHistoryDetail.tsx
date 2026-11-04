import { FC, ReactNode } from 'react';
import BigNumber from 'bignumber.js';

import {
    explorerLinkForActivity,
    formatMultichainAddress,
    MultichainActivity,
    MultichainActivityAsset
} from '@tonkeeper/core/dist/service/multichainActivityService';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { isPlaceholderTokenImage } from '@tonkeeper/core/dist/service/multichainWalletService';

import { Button, Loader } from '../../../../primitives';
import { Modal } from '../../../../primitives/Modal';
import { useSkeletonMask } from '../../../../primitives';
import { cn } from '../../../../libs/css';
import { useAppSdk } from '../../../../hooks/appSdk';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { useTranslation } from '../../../../hooks/translation';
import { useAssetDetails } from '../../../../state/trading/useAssetDetails';
import { useMultichainWalletAssets } from '../../../../state/multichain/useMultichainWalletAssets';
import { isNativeRow, networkIcon, networkLabel, parseAssetIdHead } from '../multichain-utils';
import { TokenImage } from '../TokenImage';
import {
    activityComment,
    chainBadgeLabel,
    detailAddress,
    displayTokenSymbol,
    formatHistoryAmount,
    formatHistoryDateTime,
    protocolDisplayName,
    tokenStandardLabel
} from './multichain-history-utils';
import { NftCollectionLine, nftPreviewUrl, useHistoryNft } from './MultichainHistoryNftCard';
import IcGlobe16 from '../../../../icons/components/IcGlobe16';

const assetType = (token: MultichainActivityAsset | undefined): string =>
    token ? parseAssetIdHead(token.assetId).type : 'coin';

/**
 * Same rule as the portfolio row: a chain's own coin is shown as the chain
 * icon itself, so it carries no chain badge; everything else gets one.
 */
const showsChainBadge = (token: MultichainActivityAsset | undefined): boolean =>
    token !== undefined && !isNativeRow(token.assetId);

const realImage = (image: string | undefined): string | undefined =>
    image && !isPlaceholderTokenImage(image) ? image : undefined;

/**
 * The art for an activity's token. The feed's own `image` is the first
 * choice; when the backend sent none (or its placeholder), the wallet's
 * balance list and then the trading catalog are asked for the same asset
 * id — both routinely know a token the activity indexer has no art for.
 * Coins carry no image at all and draw the chain icon via the fallback.
 */
function useActivityTokenImage(token: MultichainActivityAsset | undefined): string | undefined {
    const { data: portfolio } = useMultichainWalletAssets();
    const feedImage = realImage(token?.image);
    const portfolioImage = realImage(
        portfolio?.assets.find(a => a.assetId === token?.assetId)?.image
    );
    const needsCatalog =
        token !== undefined &&
        !feedImage &&
        !portfolioImage &&
        assetType(token) !== 'coin' &&
        assetType(token) !== 'nft';
    const { data: details } = useAssetDetails(needsCatalog ? token?.assetId ?? '' : '');
    return feedImage ?? portfolioImage ?? realImage(details?.asset.image);
}

/** Portfolio avatar recipe: the remote art, else the local chain icon. */
const TokenCircle: FC<{ src?: string; chain: string; className: string }> = ({
    src,
    chain,
    className
}) => (
    <TokenImage
        src={src}
        fallback={networkIcon(chain)}
        className={cn('bg-backgroundContent', className)}
    />
);

const ChainBadge: FC<{ chain: string; className: string }> = ({ chain, className }) => (
    <div
        className={cn(
            'absolute overflow-hidden rounded-full border-4 border-backgroundPage [&>svg]:size-full',
            className
        )}
    >
        {networkIcon(chain)}
    </div>
);

const AmountTitle: FC<{ sign: string; amount: string; symbol: string; network: string }> = ({
    sign,
    amount,
    symbol,
    network
}) => (
    <>
        {sign} {amount} {symbol} <span className="text-textTertiary">{network}</span>
    </>
);

const Cell: FC<{ children: ReactNode; last?: boolean }> = ({ children, last }) => (
    <div className={cn('bg-backgroundContent px-4', !last && 'border-b border-separatorCommon')}>
        {children}
    </div>
);

const LabelValueCell: FC<{ label: string; value: ReactNode; sub?: ReactNode; last?: boolean }> = ({
    label,
    value,
    sub,
    last
}) => (
    <Cell last={last}>
        <div className="flex flex-col justify-center py-4">
            <div className="flex items-start gap-2 text-body1">
                <span className="shrink-0 text-textSecondary">{label}</span>
                <span className="min-w-0 flex-1 text-right text-label1 text-textPrimary">
                    {value}
                </span>
            </div>
            {sub && <div className="text-right text-body2 text-textSecondary">{sub}</div>}
        </div>
    </Cell>
);

function fiat(usd?: number): string | undefined {
    return usd === undefined
        ? undefined
        : formatFiatCurrency(FiatCurrencies.USD, new BigNumber(usd));
}

export const MultichainHistoryDetail: FC<{
    activity?: MultichainActivity;
    isOpen: boolean;
    onClose: () => void;
}> = ({ activity, isOpen, onClose }) => {
    const {
        t,
        i18n: { language }
    } = useTranslation();
    const sdk = useAppSdk();
    const pendingMask = useSkeletonMask(true);

    const isSwap = activity?.activityType === 'swap';
    const isReceive =
        activity?.activityType === 'receive' ||
        activity?.activityType === 'mint' ||
        (activity !== undefined &&
            !['send', 'stake', 'unstake', 'burn', 'swap', 'dns_renew'].includes(
                activity.activityType
            ) &&
            activity.direction === 'in');

    const primaryToken = isReceive ? activity?.inToken : activity?.outToken;
    const nft = useHistoryNft(activity, primaryToken);
    const outImage = useActivityTokenImage(activity?.outToken);
    const inImage = useActivityTokenImage(activity?.inToken);
    const primaryImage = isReceive ? inImage : outImage;

    if (!activity) return null;

    const isFailed = activity.status === 'failed' || activity.status === 'dropped';
    const isPending = activity.status === 'pending';

    const primaryUsd = isReceive ? activity.inAmountUsd : activity.outAmountUsd;

    // A pending cross-chain swap doesn't know its destination leg yet — the
    // backend fills the received amount, fee and destination tx as the swap
    // settles. Those fields mask (they are genuinely in flight); everything
    // already known stays live, per the mockup.
    const pendingInAmount = isSwap && isPending && !activity.inAmount;
    const pendingFee = isPending && !(activity.feeToken && activity.feeAmount);

    const dateKey = isSwap
        ? 'multichain_history_swapped_date'
        : activity.activityType === 'stake'
        ? 'multichain_history_staked_date'
        : activity.activityType === 'unstake'
        ? 'multichain_history_unstaked_date'
        : activity.activityType === 'burn'
        ? 'multichain_history_burned_date'
        : activity.activityType === 'dns_renew'
        ? 'multichain_history_renewed_date'
        : isReceive
        ? 'transaction_receive_date'
        : 'transaction_sent_date';

    const counterparty = isReceive ? activity.fromAddress : activity.toAddress;
    const counterpartyName = isReceive ? activity.fromName : activity.toName;
    const addressLabel = isReceive
        ? t('multichain_history_sender_address')
        : t('multichain_history_recipient_address');

    const networkValue = isSwap ? (
        <>
            {networkLabel(activity.fromChain)} <span className="text-textSecondary">→</span>{' '}
            {networkLabel(activity.toChain)}
        </>
    ) : (
        networkLabel(activity.fromChain)
    );
    const networkSub = isSwap ? undefined : tokenStandardLabel(primaryToken);

    const feeVisible = Boolean(activity.feeToken && activity.feeAmount);
    const comment = activityComment(activity);

    const explorer = explorerLinkForActivity(activity);
    const protocolName = protocolDisplayName(activity);

    return (
        <Modal isOpen={isOpen} onClose={onClose} mobileHeight="auto">
            <div className="flex flex-col items-center">
                {isSwap ? (
                    <div className="relative h-[72px] w-[136px]">
                        <TokenCircle
                            src={outImage}
                            chain={activity.fromChain}
                            className="absolute left-0 top-0 size-[72px] bg-backgroundContent"
                        />
                        <TokenCircle
                            src={inImage}
                            chain={activity.toChain}
                            className="absolute left-16 top-0 size-[72px] border-4 border-backgroundPage bg-backgroundContent"
                        />
                        {showsChainBadge(activity.outToken) && (
                            <ChainBadge
                                chain={activity.fromChain}
                                className="-bottom-1 left-[2px] size-[26px]"
                            />
                        )}
                        {showsChainBadge(activity.inToken) && (
                            <ChainBadge
                                chain={activity.toChain}
                                className="-bottom-1 right-[2px] size-[26px]"
                            />
                        )}
                    </div>
                ) : nft ? (
                    <div className="relative size-24">
                        <div className="size-24 overflow-hidden rounded-2xl bg-backgroundContent">
                            {nftPreviewUrl(nft, '500x500') && (
                                <img
                                    src={nftPreviewUrl(nft, '500x500')}
                                    alt=""
                                    className="size-full object-cover"
                                />
                            )}
                        </div>
                        <ChainBadge
                            chain={activity.fromChain}
                            className="-bottom-1 -right-1 size-8"
                        />
                    </div>
                ) : (
                    <div className="relative size-24">
                        <TokenCircle
                            src={primaryImage}
                            chain={activity.fromChain}
                            className="size-24 bg-backgroundContent"
                        />
                        {showsChainBadge(primaryToken) && (
                            <ChainBadge
                                chain={activity.fromChain}
                                className="-bottom-1 -right-1 size-8"
                            />
                        )}
                    </div>
                )}

                <div className="mt-5 flex flex-col items-center gap-1 px-8 text-center">
                    {nft ? (
                        <>
                            <h2 className="text-h2 text-textPrimary">
                                {nft.dns ?? nft.metadata?.name ?? 'NFT'}
                            </h2>
                            <NftCollectionLine
                                nft={nft}
                                className="justify-center text-body1 text-textSecondary"
                            />
                        </>
                    ) : (
                        <h2 className="text-h2 text-textPrimary">
                            {isSwap ? (
                                <>
                                    <div>
                                        <AmountTitle
                                            sign="−"
                                            amount={formatHistoryAmount(
                                                activity.outAmount ?? '0',
                                                activity.outToken?.decimals ?? 0
                                            )}
                                            symbol={
                                                activity.outToken
                                                    ? displayTokenSymbol(activity.outToken)
                                                    : ''
                                            }
                                            network={chainBadgeLabel(activity.fromChain)}
                                        />
                                    </div>
                                    <div>
                                        {pendingInAmount ? (
                                            <>
                                                <span
                                                    {...pendingMask({
                                                        w: 140,
                                                        h: 32,
                                                        r: 'var(--tk-rounding-full)'
                                                    })}
                                                    className="mr-2 inline-block h-8 w-[140px] align-middle"
                                                />
                                                <span className="text-textTertiary">
                                                    {chainBadgeLabel(activity.toChain)}
                                                </span>
                                            </>
                                        ) : (
                                            <AmountTitle
                                                sign="+"
                                                amount={formatHistoryAmount(
                                                    activity.inAmount ?? '0',
                                                    activity.inToken?.decimals ?? 0
                                                )}
                                                symbol={
                                                    activity.inToken
                                                        ? displayTokenSymbol(activity.inToken)
                                                        : ''
                                                }
                                                network={chainBadgeLabel(activity.toChain)}
                                            />
                                        )}
                                    </div>
                                </>
                            ) : (
                                <AmountTitle
                                    sign={isReceive ? '+' : '−'}
                                    amount={formatHistoryAmount(
                                        (isReceive ? activity.inAmount : activity.outAmount) ?? '0',
                                        primaryToken?.decimals ?? 0
                                    )}
                                    symbol={primaryToken ? displayTokenSymbol(primaryToken) : ''}
                                    network={chainBadgeLabel(
                                        isReceive ? activity.toChain : activity.fromChain
                                    )}
                                />
                            )}
                        </h2>
                    )}
                    {!nft && fiat(primaryUsd) && (
                        <div className="text-body1 text-textSecondary">{fiat(primaryUsd)}</div>
                    )}
                    <div className="text-body1 text-textSecondary">
                        {/* While pending, nothing has "swapped/sent" yet — show the
                            bare timestamp; the Pending line below names the state. */}
                        {isPending
                            ? formatHistoryDateTime(language, activity.blockTimeMs)
                            : t(dateKey, {
                                  date: formatHistoryDateTime(language, activity.blockTimeMs)
                              })}
                    </div>
                    {isFailed && (
                        <div className="text-body1 text-accentOrange">
                            {t('multichain_history_failed')}
                        </div>
                    )}
                    {isPending && (
                        <div className="flex items-center gap-1.5 text-body1 text-textSecondary">
                            {t('multichain_history_pending')}
                            <Loader size="small" className="text-iconSecondary" />
                        </div>
                    )}
                </div>

                <div className="mt-2 w-full px-4">
                    <div className="overflow-hidden rounded-medium [--tk-skeleton-fill:var(--tk-background-content-tint)]">
                        {counterpartyName && (
                            <LabelValueCell
                                label={
                                    isReceive ? t('transaction_sender') : t('transaction_recipient')
                                }
                                value={counterpartyName}
                            />
                        )}
                        {counterparty && (
                            <Cell>
                                <button
                                    type="button"
                                    onClick={() =>
                                        sdk.copyToClipboard(
                                            formatMultichainAddress(
                                                counterparty,
                                                activity.fromChain
                                            ),
                                            t('copied')
                                        )
                                    }
                                    className="flex w-full flex-col gap-0.5 py-3 text-left"
                                >
                                    <span className="text-body2 text-textSecondary">
                                        {addressLabel}
                                    </span>
                                    <span className="break-all text-label1 text-textPrimary">
                                        {detailAddress(counterparty, activity.fromChain)}
                                    </span>
                                </button>
                            </Cell>
                        )}
                        <LabelValueCell
                            label={t('send_confirm_network')}
                            value={networkValue}
                            sub={networkSub}
                            last={!feeVisible && !pendingFee && !comment && !protocolName}
                        />
                        {pendingFee && (
                            <Cell last={!comment && !protocolName}>
                                <div className="flex items-center justify-between gap-2 py-4">
                                    <span
                                        {...pendingMask({ w: 40 })}
                                        className="text-body1 text-textSecondary"
                                    >
                                        0
                                    </span>
                                    <span
                                        {...pendingMask({ w: 170 })}
                                        className="text-label1 text-textPrimary"
                                    >
                                        0
                                    </span>
                                </div>
                            </Cell>
                        )}
                        {feeVisible && (
                            <LabelValueCell
                                label={t('send_network_fee')}
                                value={`${formatHistoryAmount(
                                    activity.feeAmount as string,
                                    activity.feeToken?.decimals ?? 0
                                )} ${
                                    activity.feeToken ? displayTokenSymbol(activity.feeToken) : ''
                                }`}
                                sub={fiat(activity.feeAmountUsd)}
                                last={!comment && !protocolName}
                            />
                        )}
                        {comment && (
                            <LabelValueCell
                                label={t('send_comment')}
                                value={comment}
                                last={!protocolName}
                            />
                        )}
                        {protocolName && (
                            <LabelValueCell
                                label={t('multichain_history_protocol')}
                                value={protocolName}
                                last
                            />
                        )}
                    </div>
                </div>

                {explorer ? (
                    <Button
                        variant="secondary"
                        size="small"
                        className="mt-4"
                        leftIcon={<IcGlobe16 />}
                        onClick={() => sdk.openPage(explorer.url)}
                    >
                        {t('multichain_history_transaction')}{' '}
                        <span
                            className="text-textTertiary hover:text-textSecondary"
                            onClick={e => {
                                e.stopPropagation();
                                sdk.copyToClipboard(explorer.hash, t('copied'));
                            }}
                        >
                            {explorer.shortHash}
                        </span>
                    </Button>
                ) : (
                    isPending && (
                        <span
                            {...pendingMask({ w: 210, h: 40, r: 'var(--tk-rounding-full)' })}
                            className="mt-4 block h-10 w-[210px]"
                        />
                    )
                )}
            </div>
        </Modal>
    );
};
