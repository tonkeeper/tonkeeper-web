import { FC, ReactNode } from 'react';

import {
    MultichainActivity,
    shortenMultichainAddress
} from '@tonkeeper/core/dist/service/multichainActivityService';

import { cn } from '../../../../libs/css';
import { useIsSkeleton, useSkeletonMask } from '../../../../primitives';
import { useTranslation } from '../../../../hooks/translation';
import IcTrayArrowUp28 from '../../../../icons/components/IcTrayArrowUp28';
import IcTrayArrowDown28 from '../../../../icons/components/IcTrayArrowDown28';
import IcSwapHorizontalAlternative28 from '../../../../icons/components/IcSwapHorizontalAlternative28';
import IcUpdate28 from '../../../../icons/components/IcUpdate28';
import IcExclamationmarkCircle16 from '../../../../icons/components/IcExclamationmarkCircle16';
import { Loader } from '../../../../primitives';
import {
    activityComment,
    assetChainCode,
    chainBadgeLabel,
    displayTokenSymbol,
    formatHistoryAmount,
    formatHistoryTimestamp,
    stakingProviderForActivity
} from './multichain-history-utils';
import { MultichainHistoryNftCard, useHistoryNft } from './MultichainHistoryNftCard';

interface Cell {
    content: ReactNode;
    className?: string;
}

const AmountText: FC<{
    sign: string;
    amount: string;
    symbol: string;
    chain: string;
    positive: boolean;
}> = ({ sign, amount, symbol, chain, positive }) => (
    <>
        <span className={positive ? 'text-accentGreen' : 'text-textPrimary'}>
            {sign} {amount} {symbol}{' '}
        </span>
        <span className="text-textSecondary">{chainBadgeLabel(chain)}</span>
    </>
);

/** Send-shaped kinds debit the wallet; the row shows the outgoing leg. */
const isSendLike = (activity: MultichainActivity): boolean =>
    ['send', 'stake', 'unstake', 'burn', 'dns_renew'].includes(activity.activityType);

/** Receive-shaped kinds credit the wallet; the row shows the incoming leg. */
const isReceiveLike = (activity: MultichainActivity): boolean =>
    activity.activityType === 'receive' || activity.activityType === 'mint';

function leadingIcon(activity: MultichainActivity): ReactNode {
    if (activity.status === 'failed' || activity.status === 'dropped') {
        return <IcExclamationmarkCircle16 className="size-7" />;
    }
    if (activity.activityType === 'dns_renew') return <IcUpdate28 className="size-7" />;
    if (isSendLike(activity)) return <IcTrayArrowUp28 className="size-7" />;
    if (isReceiveLike(activity)) return <IcTrayArrowDown28 className="size-7" />;
    if (activity.activityType === 'swap') {
        return <IcSwapHorizontalAlternative28 className="size-7" />;
    }
    return activity.direction === 'in' ? (
        <IcTrayArrowDown28 className="size-7" />
    ) : (
        <IcTrayArrowUp28 className="size-7" />
    );
}

export const MultichainHistoryRow: FC<{
    activity: MultichainActivity;
    onClick?: () => void;
    /**
     * Row of a single grouped card (the asset page's history preview) rather
     * than a card of its own: the group draws the corners and the dividers,
     * so the row must not round its own — a rounded hover fill would leave
     * untinted notches at the divider lines.
     */
    grouped?: boolean;
    /** Always show the date — for rows with no date-group header above them. */
    withDate?: boolean;
}> = ({ activity, onClick, grouped = false, withDate = false }) => {
    const {
        t,
        i18n: { language }
    } = useTranslation();
    const isSkeleton = useIsSkeleton();
    const mask = useSkeletonMask();

    const sendLike = isSendLike(activity);
    const receiveLike = isReceiveLike(activity);
    const movingToken = receiveLike
        ? activity.inToken ?? activity.outToken
        : activity.outToken ?? activity.inToken;
    const nft = useHistoryNft(activity, movingToken);

    // Placeholder activities carry no real fields, so the row paints as the
    // mockup's generic cell instead of deriving lines from fake data.
    if (isSkeleton) {
        return (
            <div
                className={cn(
                    'flex w-full items-start bg-backgroundContent text-left [--tk-skeleton-fill:var(--tk-background-content-tint)]',
                    !grouped && 'rounded-medium'
                )}
            >
                <div className="flex items-center py-4 pl-4">
                    <span
                        {...mask({ w: 44, h: 44, r: 'var(--tk-rounding-full)' })}
                        className="block size-11"
                    />
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-4">
                        <span
                            {...mask({ w: 65 })}
                            className="min-w-0 flex-1 truncate text-label1 text-textPrimary"
                        >
                            {t('transaction_type_sent')}
                        </span>
                        <span
                            {...mask({ w: 41 })}
                            className="shrink-0 whitespace-nowrap text-right text-label1 text-textPrimary"
                        >
                            0
                        </span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                        <span
                            {...mask({ w: 170 })}
                            className="min-w-0 flex-1 truncate text-body2 text-textSecondary"
                        >
                            0
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    const isFailed = activity.status === 'failed' || activity.status === 'dropped';
    const isPending = activity.status === 'pending';
    const stakingProvider = stakingProviderForActivity(activity);

    // A pending activity hasn't happened yet, so its title stays in the
    // progressive form ("Sending") until the chain confirms it ("Sent").
    const title = (() => {
        switch (activity.activityType) {
            case 'swap':
                return isPending ? t('multichain_history_swapping') : t('multichain_history_swap');
            case 'stake':
                return isPending ? t('multichain_history_staking') : t('staking_action_stake');
            case 'unstake':
                return isPending ? t('multichain_history_unstaking') : t('staking_action_unstake');
            case 'burn':
                return isPending ? t('multichain_history_burning') : t('multichain_history_burned');
            case 'dns_renew':
                return isPending
                    ? t('multichain_history_domain_renewing')
                    : t('multichain_history_domain_renew');
            default:
                if (receiveLike || (!sendLike && activity.direction === 'in')) {
                    return isPending
                        ? t('multichain_history_receiving')
                        : t('transaction_type_receive');
                }
                return isPending ? t('multichain_history_sending') : t('transaction_type_sent');
        }
    })();

    const [counterparty, counterpartyName] = receiveLike
        ? [activity.fromAddress, activity.fromName]
        : activity.toAddress
        ? [activity.toAddress, activity.toName]
        : [activity.fromAddress, activity.fromName];
    const subtitle =
        stakingProvider?.name ??
        counterpartyName ??
        (counterparty
            ? shortenMultichainAddress(counterparty, activity.fromChain)
            : activity.protocol);

    const time = formatHistoryTimestamp(language, activity.blockTimeMs, new Date(), withDate);
    // Spam senders use the comment as their ad space, so it stays hidden
    // until the user opens the details.
    const comment = activity.isSpam ? undefined : activityComment(activity);

    const leftLines: Cell[] = [{ content: title, className: 'text-label1 text-textPrimary' }];
    if (subtitle) leftLines.push({ content: subtitle, className: 'text-body2 text-textSecondary' });
    if (isFailed) {
        leftLines.push({
            content: t('multichain_history_failed'),
            className: 'text-body2 text-accentOrange'
        });
    } else if (activity.isSpam) {
        leftLines.push({ content: t('spam_action'), className: 'text-body2 text-textTertiary' });
    }

    const amountLine = (
        token: MultichainActivity['inToken'],
        amount: string | undefined,
        positive: boolean,
        chainFallback: string
    ): Cell | undefined =>
        token && amount
            ? {
                  className: 'text-label1',
                  content: (
                      <AmountText
                          sign={positive ? '+' : '−'}
                          amount={formatHistoryAmount(amount, token.decimals)}
                          symbol={displayTokenSymbol(token)}
                          chain={assetChainCode(token) || chainFallback}
                          positive={positive}
                      />
                  )
              }
            : undefined;

    const rightLines: Cell[] = [];
    // The resolved NFT card already names the item — the "+1 NFT" amount
    // line would duplicate it. Send-shaped kinds show their outgoing leg
    // (falling back to the other leg, sign kept); everything unclassified
    // shows both legs, mirroring the native rendering.
    if (!nft) {
        if (sendLike) {
            const line =
                amountLine(activity.outToken, activity.outAmount, false, activity.fromChain) ??
                amountLine(activity.inToken, activity.inAmount, false, activity.toChain);
            if (line) rightLines.push(line);
        } else if (receiveLike) {
            const line =
                amountLine(activity.inToken, activity.inAmount, true, activity.toChain) ??
                amountLine(activity.outToken, activity.outAmount, true, activity.fromChain);
            if (line) rightLines.push(line);
        } else {
            const inLine = amountLine(activity.inToken, activity.inAmount, true, activity.toChain);
            const outLine = amountLine(
                activity.outToken,
                activity.outAmount,
                false,
                activity.fromChain
            );
            if (inLine) rightLines.push(inLine);
            if (outLine) rightLines.push(outLine);
        }
    }
    rightLines.push({ content: time, className: 'text-body2 text-textSecondary' });

    const lineCount = Math.max(leftLines.length, rightLines.length);

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex w-full items-start bg-backgroundContent text-left',
                !grouped && 'rounded-medium',
                // The overlay token, not the tint: the leading icon circle is
                // tint-filled and would vanish into a tint-filled row.
                onClick &&
                    'cursor-pointer transition-colors duration-100 hover:bg-backgroundHighlighted'
            )}
        >
            <div className="flex items-center py-4 pl-4">
                <div className="relative size-11">
                    <div className="flex size-11 items-center justify-center overflow-hidden rounded-full bg-backgroundContentTint text-iconSecondary">
                        {stakingProvider ? (
                            <img src={stakingProvider.iconUrl} alt="" className="size-11" />
                        ) : (
                            leadingIcon(activity)
                        )}
                    </div>
                    {isPending && (
                        <Loader
                            size="xSmall"
                            className="absolute -left-0.5 -top-0.5 rounded-full text-iconSecondary ring-2 ring-backgroundContent"
                        />
                    )}
                </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col p-4">
                {Array.from({ length: lineCount }).map((_, i) => (
                    <div key={i} className="flex items-start justify-between gap-4">
                        <span className={cn('min-w-0 flex-1 truncate', leftLines[i]?.className)}>
                            {leftLines[i]?.content}
                        </span>
                        <span
                            className={cn(
                                'shrink-0 whitespace-nowrap text-right',
                                rightLines[i]?.className
                            )}
                        >
                            {rightLines[i]?.content}
                        </span>
                    </div>
                ))}
                {nft && <MultichainHistoryNftCard nft={nft} className="mt-2" />}
                {comment && (
                    <span className="mt-2 w-fit max-w-full whitespace-pre-wrap break-words rounded-xl bg-backgroundContentTint px-3 pb-[9px] pt-2 text-body2 text-textPrimary">
                        {comment}
                    </span>
                )}
            </div>
        </button>
    );
};
