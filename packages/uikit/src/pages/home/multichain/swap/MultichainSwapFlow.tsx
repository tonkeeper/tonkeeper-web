import { CSSProperties, FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import BigNumber from 'bignumber.js';

import {
    CrossSwapApprovalMode,
    CrossSwapPayloadKind,
    crossSwapErrorCode,
    crossSwapProviderErrorCode,
    isPairNotAllowedError,
    preferredCrossSwapRoute
} from '@tonkeeper/core/dist/swapsApi';
import type {
    CrossSwapAsset,
    CrossSwapProviderErrorCode,
    CrossSwapRoute
} from '@tonkeeper/core/dist/swapsApi';
import type { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import {
    canonicalAssetId,
    isSameAssetId,
    swapAssetWalletId,
    swapCoinSpend,
    swapMinimumReceiveAmount
} from '@tonkeeper/core/dist/service/chainkit/multichainSwapService';

import { assetIdChain } from '@tonkeeper/core/dist/analytics/asset-id';
import { isUserCancellation } from '@tonkeeper/core/dist/errors/UserCancelledError';

import { Translation, useTranslation } from '../../../../hooks/translation';
import {
    toAnalyticsFeeAsset,
    useTrackTransactionSent
} from '../../../../hooks/analytics/events-hooks';
import { useAnalyticsTrack } from '../../../../hooks/analytics';
import {
    finishSwapSendWithError,
    startSwapRedOperation,
    SwapAnalyticsPair,
    SwapAnalyticsRoute,
    toSwapAnalyticsAssetId,
    useSwapAnalytics,
    useTrackSwapOpen
} from '../../../../hooks/analytics/swap';
import {
    formatAmount,
    formatPercent,
    fromAmountInput,
    toAmountInput
} from '@tonkeeper/core/dist/utils/numberFormat';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { useAppContext } from '../../../../hooks/appContext';
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue';
import { useToast } from '../../../../hooks/useNotification';
import { cn } from '../../../../libs/css';
import { MultichainRoute } from '../../../../libs/routes';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import {
    useCrossSwapAsset,
    useCrossSwapAssets,
    useCrossSwapAssetSearch,
    useCrossSwapConfig,
    useCrossSwapQuote,
    useEstimateCrossSwap,
    useExecuteCrossSwap,
    usePrepareCrossSwap,
    CROSS_SWAP_QUOTE_REFETCH_MS
} from '../../../../state/multichain/swap/useMultichainSwap';
import { useMultichainWalletAssets } from '../../../../state/multichain/useMultichainWalletAssets';
import { useMultichainSwapTonRelay } from '../../../../state/multichain/swap/useMultichainSwapTonRelay';
import { useSendFailureText } from '../../../../state/multichain/transfer/useSendFailureText';
import {
    useFeeTextFormatter,
    useLeaveForAddFunds,
    useNativeAsset
} from '../../../../components/transfer/multichain/SendConfirmShell';
import { NetworkFeeValue } from '../../../../components/transfer/multichain/NetworkFeeValue';
import { InsufficientFundsSheet } from '../../../../components/transfer/multichain/InsufficientFundsSheet';
import {
    FeeMethodBatteryIcon,
    SendFeeMethodSheet
} from '../../../../components/transfer/multichain/SendFeeMethodSheet';
import { AssetIcon } from '../../../../components/transfer/multichain/multichainSendShared';
import { BatteryModal } from '../battery/BatteryModal';
import { SelectDropdown } from '../SelectPill';
import {
    Button,
    Checkbox,
    Loader,
    SearchField,
    SkeletonScope,
    useIsSkeleton,
    useSkeletonMask
} from '../../../../primitives';
import { Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives/Modal';
import { ChainBadgeOverlay, ChainChip, TokenSwitch } from '../../../../primitives';
import IcSwapVertical16 from '../../../../icons/components/IcSwapVertical16';
import IcExclamationmarkCircle16 from '../../../../icons/components/IcExclamationmarkCircle16';
import IcExclamationmarkCircle28 from '../../../../icons/components/IcExclamationmarkCircle28';
import IcDonemarkOutline28 from '../../../../icons/components/IcDonemarkOutline28';
import IcArrowDown16 from '../../../../icons/components/IcArrowDown16';
import IcChevronUp16 from '../../../../icons/components/IcChevronUp16';
import IcChevronDown16 from '../../../../icons/components/IcChevronDown16';
import IcSwap16 from '../../../../icons/components/IcSwap16';
import IcCheckmarkCircle32 from '../../../../icons/components/IcCheckmarkCircle32';
import IcExclamationmarkTriangle16 from '../../../../icons/components/IcExclamationmarkTriangle16';
import IcExclamationmarkTriangle84 from '../../../../icons/components/IcExclamationmarkTriangle84';
import IcExclamationmarkCircle84 from '../../../../icons/components/IcExclamationmarkCircle84';
import IcBatteryFlash44 from '../../../../icons/components/IcBatteryFlash44';
import { TokenImage } from '../TokenImage';
import { TokenCell, TokenCellIcon } from '../TokenCell';
import { MultichainHint } from '../MultichainHint';
import { isNativeRow, networkIcon, networkLabel, parseAssetIdHead } from '../multichain-utils';
import { ModalCenterError, ModalCenterState } from '../../../../components/shared/ModalCenterState';
import { MagnifyingGlassLottie } from '../../../../components/lottie/MagnifyingGlassLottie';
import { MultichainChainChips } from '../MultichainChainChips';

type Screen = 'form' | 'pick-source' | 'pick-destination' | 'confirm' | 'warning' | 'done';

/** The chain coin can't cover the fee plus the coin the swap sends; amounts carry the symbol. */
interface CoinShortfall {
    required: string;
    balance: string;
    symbol: string;
    assetId: string;
}

// Mockup presets (3% / 1% / 0.5% / 0.1%), used for a source chain the
// backend's per-chain `slippages` config leaves out.
const FALLBACK_SLIPPAGE_OPTIONS_BPS = [10, 50, 100, 300];
const FALLBACK_SLIPPAGE_DEFAULT_BPS = 100;

// The Button primitive has no orange fill; the overrides mirror primaryRed's
// lighter hover and darker disabled shades.
const CONFIRM_WARNING_BUTTON_CLASS =
    '!bg-accentOrange hover:enabled:brightness-110 disabled:brightness-75';

type ValueDifferenceSeverity = 'none' | 'warning' | 'danger';

// Same bands as iOS and Android: -3%…-5% inclusive warns, anything worse is
// danger. Both ask for confirmation before the swap is signed.
const valueDifferenceSeverity = (bps: number | undefined): ValueDifferenceSeverity =>
    bps === undefined || bps > -300 ? 'none' : bps < -500 ? 'danger' : 'warning';

// iOS `MultichainSwapDefaultAssets`: the pair always starts as TON → ETH.
const DEFAULT_SOURCE_ASSET_ID = 'ton/mainnet/coin';
const DEFAULT_DESTINATION_ASSET_ID = 'eth/mainnet/coin';

/**
 * Stand-in for the amount cards while the supported-assets list loads. Every
 * visible field is masked; the network segment must not resolve to a real
 * chain so no icon or badge sneaks in.
 */
const PLACEHOLDER_SWAP_ASSET: CrossSwapAsset = {
    assetId: 'placeholder/mainnet/coin',
    symbol: 'TOKEN',
    name: 'Placeholder',
    decimals: 9,
    image: '',
    chainId: 'placeholder',
    chainFamily: 'EVM',
    supportedAggregators: []
};

// Both natives reserve 1 TON for fees on a TON-leg MAX (Android
// `SwapRepository.getMaxReserve`, iOS `NativeSwapConstants.tonFeeReserve`);
// other chains reserve nothing (their fee is charged separately or
// covered by gas).
const MAX_RESERVE: Record<string, number> = { 'ton/mainnet/coin': 1 };

// As on iOS, GRAM is the one asset whose floor is known before quoting: the
// same 1 GRAM MAX keeps back. Other assets learn theirs from the provider,
// as `min_amount_not_met`.
const MIN_SWAP_AMOUNT: Record<string, number> = { 'ton/mainnet/coin': 1 };

/** The chain's own coin, ETH on Base and Arbitrum included — unlike `isNativeRow`. */
const isChainCoin = (asset: CrossSwapAsset): boolean =>
    parseAssetIdHead(asset.assetId).type === 'coin';

/** The wallets-backend id of the coin that pays fees on `asset`'s chain. */
const chainCoinWalletId = (asset: CrossSwapAsset): string =>
    [...swapAssetWalletId(asset.assetId).split('/').slice(0, 2), 'coin'].join('/');

// A prepare that failed on an expired route can only be cleared by a
// fresh quote; retry on this ladder before handing the failure to the
// user (mirrors iOS `MultichainSwapExecutionFailure+RouteRecovery`).
const PREPARE_RETRY_DELAYS_MS = [500, 1000, 2000];

// `prepare` rejects with the quote's provider codes plus its own balance
// one. Apart from an unavailable provider, none of them is tied to the
// route, so a fresh one can't clear them and they skip the retry ladder.
const PREPARE_ERROR_MESSAGE_KEY: Record<string, string> = {
    insufficient_balance: 'send_screen_steps_amount_insufficient_balance',
    min_amount_not_met: 'multichain_swap_provider_error_min_amount_not_met',
    no_route: 'multichain_swap_no_route',
    asset_not_supported: 'multichain_swap_no_route',
    pair_not_allowed: 'multichain_swap_no_route',
    provider_unavailable: 'multichain_swap_provider_error_provider_unavailable',
    wallet_screened: 'multichain_swap_provider_error_wallet_screened'
};

const prepareErrorMessageKey = (error: unknown): string | undefined => {
    const code = crossSwapErrorCode(error);
    return code ? PREPARE_ERROR_MESSAGE_KEY[code] : undefined;
};

const isPrepareErrorRouteBound = (error: unknown): boolean => {
    const code = crossSwapErrorCode(error);
    return !code || code === 'provider_unavailable' || !(code in PREPARE_ERROR_MESSAGE_KEY);
};

const PROVIDER_ERROR_MESSAGE_KEY: Record<
    Exclude<CrossSwapProviderErrorCode, 'no_route'>,
    string
> = {
    country_blocked: 'multichain_swap_provider_error_country_blocked',
    min_amount_not_met: 'multichain_swap_provider_error_min_amount_not_met',
    asset_not_supported: 'multichain_swap_provider_error_asset_not_supported',
    provider_unavailable: 'multichain_swap_provider_error_provider_unavailable',
    wallet_screened: 'multichain_swap_provider_error_wallet_screened',
    insufficient_balance: 'send_screen_steps_amount_insufficient_balance',
    provider_error: 'multichain_swap_provider_error_unknown'
};

const isPairAllowed = (source: CrossSwapAsset, destination: CrossSwapAsset): boolean =>
    source.assetId !== destination.assetId &&
    (!source.allowedCounterparts || source.allowedCounterparts.includes(destination.assetId)) &&
    (!destination.allowedCounterparts || destination.allowedCounterparts.includes(source.assetId));

const formatUnits = (amount: string, decimals: number): string =>
    formatAmount(new BigNumber(amount).shiftedBy(-decimals));

// Fraction digits are capped at the asset's decimals, like on iOS: a
// finer amount would round down to zero units and could never be quoted.
const isValidAmountInput = (value: string, decimals: number): boolean =>
    decimals > 0 ? new RegExp(`^\\d*(?:\\.\\d{0,${decimals}})?$`).test(value) : /^\d*$/.test(value);

const sourceUnits = (amount: string, decimals: number): string | undefined => {
    if (!/^\d*(?:\.\d*)?$/.test(amount) || !amount || new BigNumber(amount).lte(0)) {
        return undefined;
    }
    return new BigNumber(amount).shiftedBy(decimals).integerValue(BigNumber.ROUND_DOWN).toFixed(0);
};

const networkCode = (asset: CrossSwapAsset): string => parseAssetIdHead(asset.assetId).network;

const walletBalance = (asset: MultichainWalletAsset | undefined): BigNumber =>
    asset ? new BigNumber(asset.balance).shiftedBy(-asset.decimals) : new BigNumber(0);

const SwapAssetImage: FC<{ asset: CrossSwapAsset }> = ({ asset }) => {
    const network = networkCode(asset);
    const native = isNativeRow(asset.assetId);
    const token = (
        <TokenImage
            src={asset.image}
            fallback={native ? networkIcon(network) : undefined}
            className="size-11"
        />
    );
    return native ? (
        token
    ) : (
        <ChainBadgeOverlay icon={networkIcon(network)}>{token}</ChainBadgeOverlay>
    );
};

/** The rate line's stand-in under the amount cards while assets load. */
const SwapRateBar: FC = () => {
    const mask = useSkeletonMask();
    return (
        <span {...mask({ w: 150 })} className="text-body2 text-textSecondary">
            0
        </span>
    );
};

/**
 * The form's asset pill is the send flow's `TokenSwitch`; while the form is
 * masked the pill keeps its footprint but paints nothing, like the cards
 * around it.
 */
const AssetCapsule: FC<{ asset: CrossSwapAsset; onClick?: () => void }> = ({ asset, onClick }) => {
    const isSkeleton = useIsSkeleton();
    const network = networkCode(asset);
    const native = isNativeRow(asset.assetId);
    return (
        <TokenSwitch
            icon={asset.image ? <img src={asset.image} alt="" /> : networkIcon(network)}
            chainBadge={native ? undefined : networkIcon(network)}
            symbol={asset.symbol}
            onClick={onClick}
            disabled={isSkeleton}
            className={cn(isSkeleton && 'text-transparent [&>*]:invisible')}
        />
    );
};

export const MultichainSwapAmountCard: FC<{
    label: string;
    asset: CrossSwapAsset;
    amount: string;
    onAmount?: (value: string) => void;
    onAsset: () => void;
    onMax?: () => void;
    balance?: BigNumber.Value;
    fiat?: string;
    error?: string;
    /** Read-only cards only: shown in place of an empty amount, e.g. "No quote". */
    placeholder?: string;
}> = ({ label, asset, amount, onAmount, onAsset, onMax, balance, fiat, error, placeholder }) => {
    const { t } = useTranslation();
    const isSkeleton = useIsSkeleton();
    const mask = useSkeletonMask();
    const [focused, setFocused] = useState(false);
    return (
        <div
            className={cn(
                'rounded-medium border-[1.5px] bg-fieldBackground px-4 py-3 [--tk-skeleton-fill:var(--tk-background-content-tint)]',
                error
                    ? 'border-fieldErrorBorder'
                    : focused
                    ? 'border-fieldActiveBorder'
                    : 'border-transparent'
            )}
        >
            <div className="mb-1 text-body2 text-textSecondary">{label}</div>
            <div className="flex items-center gap-3">
                {isSkeleton ? (
                    <div className="min-w-0 flex-1">
                        <span
                            {...mask({ w: 100, h: 36, r: 'var(--tk-rounding-full)' })}
                            className="block h-10 w-[100px]"
                        />
                    </div>
                ) : onAmount ? (
                    <input
                        aria-label={label}
                        type="text"
                        autoComplete="off"
                        inputMode="decimal"
                        placeholder="0"
                        value={toAmountInput(amount)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        onChange={event => {
                            const next = fromAmountInput(event.target.value);
                            if (isValidAmountInput(next, asset.decimals)) onAmount(next);
                        }}
                        className="min-w-0 flex-1 border-0 bg-transparent text-num3 text-textPrimary outline-none placeholder:text-textTertiary"
                    />
                ) : (
                    <div
                        className={cn(
                            'min-w-0 flex-1 truncate text-num3',
                            !amount && placeholder ? 'text-textSecondary' : 'text-textPrimary'
                        )}
                    >
                        {amount || placeholder || '0'}
                    </div>
                )}
                <AssetCapsule asset={asset} onClick={onAsset} />
            </div>
            <div className="mt-1 flex min-h-5 items-center justify-between gap-3 text-body2">
                <span
                    {...mask({ w: 40 })}
                    className={cn('truncate', error ? 'text-accentRed' : 'text-textSecondary')}
                >
                    {error ?? fiat ?? ''}
                </span>
                {balance !== undefined && (
                    <span
                        {...mask({ w: 170 })}
                        className="flex shrink-0 items-center gap-2 text-textSecondary"
                    >
                        {t('swap_balance')}: {formatAmount(balance)}
                        {onMax && !isSkeleton && (
                            <button
                                type="button"
                                onClick={onMax}
                                className="cursor-pointer text-label2 text-textAccent transition-opacity duration-100 hover:opacity-80"
                            >
                                {t('swap_max')}
                            </button>
                        )}
                    </span>
                )}
            </div>
        </div>
    );
};

const PICKER_PLACEHOLDER_IDS = Array.from(
    { length: 8 },
    (_, index) => `placeholder/mainnet/token/${index}`
);

export const AssetPicker: FC<{
    assets: CrossSwapAsset[];
    walletAssets: MultichainWalletAsset[];
    counterpart: CrossSwapAsset | undefined;
    selected: CrossSwapAsset | undefined;
    onSelect: (asset: CrossSwapAsset) => void;
    /** Source pickers only allow assets the wallet can actually spend. */
    requirePositiveBalance?: boolean;
    /**
     * Reports the typed query and the picked chain (as the asset id head,
     * `eth/mainnet`) so the host can search the catalog server-side.
     */
    onSearchChange?: (query: string, chainId: string | undefined) => void;
    /**
     * Catalog matches for the current query and chain, listed in the
     * backend's order. Replaces `assets` while a query or a chain is set.
     */
    searchResults?: CrossSwapAsset[];
    searchError?: boolean;
    onSearchRetry?: () => void;
}> = ({
    assets,
    walletAssets,
    counterpart,
    selected,
    onSelect,
    requirePositiveBalance = false,
    onSearchChange,
    searchResults,
    searchError,
    onSearchRetry
}) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const [search, setSearch] = useState('');
    const [chain, setChain] = useState('all');
    const balances = useMemo(
        () => new Map(walletAssets.map(asset => [asset.assetId, asset])),
        [walletAssets]
    );
    const chainIds = useMemo(
        () => new Map(assets.map(asset => [networkCode(asset), asset.chainId])),
        [assets]
    );
    const networks = useMemo(() => Array.from(chainIds.keys()), [chainIds]);
    const normalizedSearch = search.trim();
    const searching = normalizedSearch.length > 0 || chain !== 'all';
    const searchPending = searching && !searchResults;
    // `nothingToSpend`: the catalog matched, the wallet holds none of it. The
    // source picker tells that apart from "nothing matched" so a zero balance
    // isn't reported as a missing asset.
    const { filtered, nothingToSpend } = useMemo(() => {
        const candidates = (searching ? searchResults ?? [] : assets).filter(asset => {
            if (counterpart && !isPairAllowed(asset, counterpart)) return false;
            // Results kept from the previous chain's search stay out until
            // the new chain's arrive.
            return chain === 'all' || networkCode(asset) === chain;
        });
        const spendable = requirePositiveBalance
            ? candidates.filter(asset =>
                  walletBalance(balances.get(swapAssetWalletId(asset.assetId))).gt(0)
              )
            : candidates;
        return {
            filtered: spendable,
            nothingToSpend:
                requirePositiveBalance && candidates.length > 0 && spendable.length === 0
        };
    }, [assets, searching, searchResults, counterpart, chain, requirePositiveBalance, balances]);
    const changeSearch = (value: string) => {
        setSearch(value);
        onSearchChange?.(value, chain === 'all' ? undefined : chainIds.get(chain));
    };
    const changeChain = (next: string | undefined) => {
        setChain(next ?? 'all');
        onSearchChange?.(search, next ? chainIds.get(next) : undefined);
    };

    return (
        <div className="flex h-full flex-col">
            <div className="flex shrink-0 flex-col gap-3 pb-3">
                <SearchField
                    value={search}
                    onChange={changeSearch}
                    placeholder={t('send_choose_asset_search')}
                    className="!p-0"
                />

                <MultichainChainChips
                    value={chain === 'all' ? undefined : chain}
                    onChange={changeChain}
                    chains={networks}
                />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {searchPending && searchError ? (
                    <div className="pt-8">
                        <ModalCenterError
                            icon={<IcExclamationmarkCircle28 />}
                            onRetry={() => onSearchRetry?.()}
                        />
                    </div>
                ) : searchPending ? (
                    <SkeletonScope loading>
                        <div className="overflow-hidden rounded-medium bg-backgroundContent">
                            {PICKER_PLACEHOLDER_IDS.map((assetId, index) => (
                                <div
                                    key={assetId}
                                    className={index === 0 ? '' : 'border-t border-separatorCommon'}
                                >
                                    <TokenCell
                                        icon={<TokenCellIcon assetId={assetId} />}
                                        title="TOKEN"
                                        subtitle="0 TOKEN"
                                    />
                                </div>
                            ))}
                        </div>
                    </SkeletonScope>
                ) : filtered.length === 0 ? (
                    <div className="pt-8">
                        <ModalCenterState
                            icon={<MagnifyingGlassLottie />}
                            title={
                                nothingToSpend
                                    ? t('multichain_swap_no_matching_assets')
                                    : t('not_found_title')
                            }
                            subtitle={
                                !nothingToSpend && normalizedSearch
                                    ? t('search_no_results', { query: normalizedSearch })
                                    : undefined
                            }
                        />
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-medium bg-backgroundContent">
                        {filtered.map((asset, index) => {
                            const walletAsset = balances.get(swapAssetWalletId(asset.assetId));
                            const balance = walletBalance(walletAsset);
                            const balanceFiat =
                                walletAsset?.price !== undefined
                                    ? formatFiatCurrency(
                                          fiat,
                                          balance.multipliedBy(walletAsset.price)
                                      )
                                    : undefined;
                            return (
                                <div
                                    key={asset.assetId}
                                    className={index === 0 ? '' : 'border-t border-separatorCommon'}
                                >
                                    <TokenCell
                                        selected={selected?.assetId === asset.assetId}
                                        onClick={() => onSelect(asset)}
                                        className="transition-colors hover:bg-backgroundContentTint"
                                        icon={<SwapAssetImage asset={asset} />}
                                        title={asset.symbol}
                                        titleExtras={
                                            !isNativeRow(asset.assetId) && (
                                                <ChainChip
                                                    label={networkLabel(networkCode(asset))}
                                                />
                                            )
                                        }
                                        subtitle={`${formatAmount(balance)} ${asset.symbol}${
                                            balanceFiat ? ` · ${balanceFiat}` : ''
                                        }`}
                                        accessory={
                                            selected?.assetId === asset.assetId && (
                                                <span className="shrink-0 text-textAccent">
                                                    <IcDonemarkOutline28 className="h-6 w-6" />
                                                </span>
                                            )
                                        }
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export const DetailRow: FC<{
    label: string;
    value: ReactNode;
    description?: string;
    accent?: 'red' | 'orange';
    /** Colours the description alone, for a fee that can't be paid under an otherwise valid value. */
    descriptionAccent?: 'red';
    /** Masks the value while it is being computed (fee estimation, …). */
    loading?: boolean;
    /** Sits right after the value: a refresh indicator, a stepper glyph, … */
    trailing?: ReactNode;
    children?: ReactNode;
}> = ({ label, value, description, accent, descriptionAccent, loading, trailing, children }) => {
    const mask = useSkeletonMask(loading);
    return (
        <div className="relative flex min-h-14 items-center justify-between gap-4 px-4 py-3 [&+&]:after:absolute [&+&]:after:left-4 [&+&]:after:right-0 [&+&]:after:top-0 [&+&]:after:h-px [&+&]:after:bg-separatorCommon [&+&]:after:content-['']">
            <span className="flex shrink-0 items-center gap-1 text-body1 text-textSecondary">
                {label}
                {children}
            </span>
            <span className="relative min-w-0 text-right">
                <span className="flex items-center justify-end gap-1">
                    <span
                        {...mask({ w: 41 })}
                        className={cn(
                            'block text-label1',
                            accent === 'red'
                                ? 'text-accentRed'
                                : accent === 'orange'
                                ? 'text-accentOrange'
                                : 'text-textPrimary'
                        )}
                    >
                        {value}
                    </span>
                    {trailing}
                </span>
                {description && (
                    <span
                        className={cn(
                            'block text-body3',
                            descriptionAccent === 'red' ? 'text-accentRed' : 'text-textSecondary'
                        )}
                    >
                        {description}
                    </span>
                )}
            </span>
        </div>
    );
};

export const ValueDifferenceRow: FC<{ label: string; bps: number; children?: ReactNode }> = ({
    label,
    bps,
    children
}) => {
    const severity = valueDifferenceSeverity(bps);
    return (
        <DetailRow
            label={label}
            value={formatPercent(bps / 100, { signed: true })}
            accent={severity === 'danger' ? 'red' : severity === 'warning' ? 'orange' : undefined}
            trailing={
                severity === 'danger' ? (
                    <IcExclamationmarkTriangle16 className="size-4 shrink-0 text-accentRed" />
                ) : severity === 'warning' ? (
                    <IcExclamationmarkCircle16 className="size-4 shrink-0 text-accentOrange" />
                ) : undefined
            }
        >
            {children}
        </DetailRow>
    );
};

const batteryFeeIcon = (
    <FeeMethodBatteryIcon>
        <IcBatteryFlash44 />
    </FeeMethodBatteryIcon>
);

/** The stepper glyph next to a value that opens a preset list. */
const StepperGlyph: FC = () => (
    <span className="relative size-4 shrink-0 text-iconSecondary">
        <IcChevronUp16 className="absolute inset-0 size-4 -translate-y-[3px]" />
        <IcChevronDown16 className="absolute inset-0 size-4 translate-y-[3px]" />
    </span>
);

/**
 * Slippage value on the confirm step: the value itself is the trigger of a
 * preset list, so the row keeps the plain value/label layout of its
 * neighbours until the user taps it.
 */
export const SlippageSelect: FC<{
    label: string;
    valueBps: number;
    optionsBps: number[];
    onChange: (bps: number) => void;
}> = ({ label, valueBps, optionsBps, onChange }) => (
    <SelectDropdown
        value={valueBps}
        options={optionsBps.map(bps => ({ value: bps, label: formatPercent(bps / 100) }))}
        onChange={onChange}
        menuPosition="below-end"
        menuWidth={140}
        trigger={({ selected, open, toggle }) => (
            <button
                type="button"
                aria-label={label}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={toggle}
                className="-my-2 ml-auto flex cursor-pointer items-center gap-1 py-2 text-label1 text-textPrimary transition-colors duration-100 hover:text-textSecondary"
            >
                {selected?.label}
                <StepperGlyph />
            </button>
        )}
    />
);

/**
 * Drains over one quote refetch interval and spins while a fresh quote is in
 * flight, so the user can see how current the rate is. Remounting on a new
 * quote (`key`) restarts the drain.
 */
const QUOTE_RING_PX = 16;
const QUOTE_RING_STROKE = 2;
const QuoteRefreshRing: FC<{ fetching: boolean }> = ({ fetching }) => {
    if (fetching) return <Loader size="small" className="shrink-0 text-iconSecondary" />;
    const radius = (QUOTE_RING_PX - QUOTE_RING_STROKE) / 2;
    const length = 2 * Math.PI * radius;
    return (
        <svg
            role="img"
            aria-hidden
            className="size-4 shrink-0 -rotate-90 text-iconSecondary"
            viewBox={`0 0 ${QUOTE_RING_PX} ${QUOTE_RING_PX}`}
            fill="none"
        >
            <circle
                cx={QUOTE_RING_PX / 2}
                cy={QUOTE_RING_PX / 2}
                r={radius}
                stroke="currentColor"
                strokeOpacity={0.24}
                strokeWidth={QUOTE_RING_STROKE}
            />
            <circle
                cx={QUOTE_RING_PX / 2}
                cy={QUOTE_RING_PX / 2}
                r={radius}
                stroke="currentColor"
                strokeWidth={QUOTE_RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={length}
                className="animate-drain"
                style={
                    {
                        '--tk-drain-length': `${length}px`,
                        '--tk-drain-duration': `${CROSS_SWAP_QUOTE_REFETCH_MS}ms`
                    } as CSSProperties
                }
            />
        </svg>
    );
};

/** "Estimated time: …" under the network fee, as the native apps show it. */
const formatEstimatedTime = (t: Translation, route: CrossSwapRoute): string | undefined => {
    const time = route.estimatedTime;
    if (!time) return undefined;
    const seconds =
        time.totalSeconds ??
        (time.inboundSeconds ?? 0) + (time.swapSeconds ?? 0) + (time.outboundSeconds ?? 0);
    if (!seconds || seconds <= 0) return undefined;
    return seconds < 60
        ? t('multichain_swap_estimated_time_sec', { time: Math.ceil(seconds) })
        : t('multichain_swap_estimated_time_min', { time: Math.ceil(seconds / 60) });
};

export interface MultichainSwapFlowProps {
    isOpen: boolean;
    onClose: () => void;
    initialAssetId?: string;
    initialDirection?: 'buy' | 'sell';
}

export const MultichainSwapFlow: FC<MultichainSwapFlowProps> = ({
    isOpen,
    onClose,
    initialAssetId,
    initialDirection
}) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const toast = useToast();
    const assetsQuery = useCrossSwapAssets();
    const listed = useMemo(() => assetsQuery.data ?? [], [assetsQuery.data]);
    const assetsUnavailable = assetsQuery.isError || (!assetsQuery.isLoading && !listed.length);
    // The opener may build the id on the client with a checksummed or
    // friendly address, so ids are compared in canonical form. An asset
    // outside the capped list is fetched on its own and joins the selectable
    // set.
    const requestedId = initialAssetId ? canonicalAssetId(initialAssetId) : undefined;
    const requestedListed =
        !requestedId || listed.some(asset => isSameAssetId(asset.assetId, requestedId));
    const requestedQuery = useCrossSwapAsset(
        assetsQuery.data && !requestedListed ? requestedId : undefined
    );
    // A disabled query still reports `isLoading`, so gate on an actual fetch.
    const requestedPending =
        !!requestedId && !requestedListed && requestedQuery.fetchStatus === 'fetching';
    const requested = useMemo(
        () =>
            requestedId
                ? listed.find(asset => isSameAssetId(asset.assetId, requestedId)) ??
                  requestedQuery.data ??
                  undefined
                : undefined,
        [listed, requestedId, requestedQuery.data]
    );
    // The backend picks the opening pair around the tapped asset, as the
    // native apps do; a pinned side is passed under the catalog's own id.
    const pairSelection = useMemo(
        () =>
            !isOpen || !assetsQuery.data || requestedPending
                ? undefined
                : requested && initialDirection === 'sell'
                ? { fromAssetId: requested.assetId }
                : requested && initialDirection === 'buy'
                ? { toAssetId: requested.assetId }
                : {},
        [isOpen, assetsQuery.data, requestedPending, requested, initialDirection]
    );
    const configQuery = useCrossSwapConfig(pairSelection);
    const backendPair = configQuery.data?.defaultPair;
    const pairPending = !!pairSelection && configQuery.fetchStatus === 'fetching';
    const supported = useMemo(() => {
        const extras = [
            requestedQuery.data,
            backendPair?.sourceAsset,
            backendPair?.destinationAsset
        ];
        const known = new Set(listed.map(asset => asset.assetId));
        const merged = [...listed];
        for (const asset of extras) {
            if (asset && !known.has(asset.assetId)) {
                known.add(asset.assetId);
                merged.push(asset);
            }
        }
        return merged;
    }, [listed, requestedQuery.data, backendPair]);
    const [pickerFilter, setPickerFilter] = useState<{ query: string; chainId?: string }>({
        query: ''
    });
    const pickerQuery = useDebouncedValue(pickerFilter.query.trim(), 300);
    const searchQuery = useCrossSwapAssetSearch(pickerQuery, pickerFilter.chainId);
    const { data: walletData } = useMultichainWalletAssets();
    const walletAssets = useMemo(() => walletData?.assets ?? [], [walletData]);
    const walletById = useMemo(
        () => new Map(walletAssets.map(asset => [asset.assetId, asset])),
        [walletAssets]
    );
    const walletAssetOf = (asset: CrossSwapAsset | undefined): MultichainWalletAsset | undefined =>
        asset ? walletById.get(swapAssetWalletId(asset.assetId)) : undefined;

    const [screen, setScreen] = useState<Screen>('form');
    const [source, setSource] = useState<CrossSwapAsset>();
    const [destination, setDestination] = useState<CrossSwapAsset>();
    const [amount, setAmount] = useState('');
    const [maxFill, setMaxFill] = useState<string>();
    const [lastSwitch, setLastSwitch] = useState<{
        sourceId: string;
        destinationId: string;
        amount: string;
        replaced: string;
    }>();
    const isMax = maxFill !== undefined && amount === maxFill;
    const [slippageBps, setSlippageBps] = useState(FALLBACK_SLIPPAGE_DEFAULT_BPS);
    const [unlimitedApproval, setUnlimitedApproval] = useState(false);
    const [rateInverted, setRateInverted] = useState(false);
    const [feeSheetOpen, setFeeSheetOpen] = useState(false);
    const [batteryOpen, setBatteryOpen] = useState(false);
    const debouncedAmount = useDebouncedValue(amount, 500);

    useEffect(() => {
        if (!isOpen || supported.length === 0 || source || requestedPending || pairPending) {
            return;
        }
        if (backendPair) {
            setSource(backendPair.sourceAsset);
            setDestination(backendPair.destinationAsset);
            return;
        }
        // Local fallback for when the backend has no answer: the default
        // counterpart when the pair allows it, otherwise the first asset that
        // does — the requested side is what the user tapped and is never
        // traded away.
        const byId = new Map(supported.map(asset => [asset.assetId, asset]));
        const defaultSource = byId.get(DEFAULT_SOURCE_ASSET_ID) ?? supported[0];
        const defaultDestination = byId.get(DEFAULT_DESTINATION_ASSET_ID);
        const sourceFor = (fixed: CrossSwapAsset) => {
            const preferred =
                fixed.assetId === DEFAULT_SOURCE_ASSET_ID ? defaultDestination : defaultSource;
            if (preferred && isPairAllowed(preferred, fixed)) return preferred;
            return supported.find(asset => isPairAllowed(asset, fixed));
        };
        const destinationFor = (fixed: CrossSwapAsset) => {
            const preferred =
                fixed.assetId === DEFAULT_DESTINATION_ASSET_ID ? defaultSource : defaultDestination;
            if (preferred && isPairAllowed(fixed, preferred)) return preferred;
            return supported.find(asset => isPairAllowed(fixed, asset));
        };

        let nextSource: CrossSwapAsset | undefined;
        let nextDestination: CrossSwapAsset | undefined;
        if (requested && initialDirection === 'sell') {
            nextSource = requested;
            nextDestination = destinationFor(requested);
        } else if (requested && initialDirection === 'buy') {
            nextDestination = requested;
            nextSource = sourceFor(requested);
        } else {
            nextSource = defaultSource;
            nextDestination = defaultSource ? destinationFor(defaultSource) : undefined;
        }
        if (!nextSource) nextSource = defaultSource;
        setSource(nextSource);
        setDestination(nextDestination);
    }, [
        requested,
        requestedPending,
        pairPending,
        backendPair,
        initialDirection,
        isOpen,
        supported,
        source
    ]);

    useEffect(() => {
        if (isOpen) return;
        setScreen('form');
        setAmount('');
        setLastSwitch(undefined);
        setSource(undefined);
        setDestination(undefined);
        setUnlimitedApproval(false);
        setRateInverted(false);
        setFeeSheetOpen(false);
        setBatteryOpen(false);
    }, [isOpen]);

    // Slippage presets follow the source chain, as on the native apps; a new
    // source chain (or a config answer) re-selects that chain's default.
    const slippageChainKey = source ? networkCode(source) : undefined;
    const chainSlippage = slippageChainKey
        ? configQuery.data?.slippages[slippageChainKey]
        : undefined;
    const slippageOptionsBps = chainSlippage?.optionsBps ?? FALLBACK_SLIPPAGE_OPTIONS_BPS;
    const slippageDefaultBps = chainSlippage?.defaultBps ?? FALLBACK_SLIPPAGE_DEFAULT_BPS;
    const slippageOptionsKey = slippageOptionsBps.join(',');
    useEffect(() => {
        setSlippageBps(slippageDefaultBps);
    }, [slippageChainKey, slippageDefaultBps, slippageOptionsKey]);

    const sourceWallet = walletAssetOf(source);
    const sourceBalance = walletBalance(sourceWallet);
    const amountExceedsBalance = !!amount && new BigNumber(amount).gt(sourceBalance);
    const minimumAmount = source ? MIN_SWAP_AMOUNT[source.assetId] : undefined;
    const belowMinimum =
        minimumAmount !== undefined &&
        !!amount &&
        new BigNumber(amount).gt(0) &&
        new BigNumber(amount).lt(minimumAmount);
    const units = source ? sourceUnits(debouncedAmount, source.decimals) : undefined;
    // An amount the wallet can't cover is still priced, so the rate and the
    // receive amount stay filled in next to the shortfall; Continue is what
    // stays blocked.
    const quote = useCrossSwapQuote({
        sourceAsset: source,
        destinationAsset: destination,
        sourceAmount: units,
        slippageBps,
        isMax: maxFill !== undefined && debouncedAmount === maxFill,
        paused: screen === 'done'
    });
    // Emptying the amount disables the query, but `keepPreviousData` still
    // hands back the last route — which would leave the receive card and the
    // rate line filled in for an input the user has just cleared. A failed
    // refetch also keeps the previous data, so an errored quote must not keep
    // pricing the swap off the stale route either.
    const liveRoute =
        units && !quote.isError ? preferredCrossSwapRoute(quote.data?.routes ?? []) : undefined;
    // The confirm step never shows or sends a route past its expiry: back in
    // a tab that sat in the background, the last quote is masked until the
    // refetch on return replaces it.
    const route =
        (screen === 'confirm' || screen === 'warning') &&
        liveRoute &&
        new Date(liveRoute.dateExpire).getTime() <= Date.now()
            ? undefined
            : liveRoute;
    const routeSpend =
        source && route && isChainCoin(source) ? swapCoinSpend(source, route.payloads) : undefined;
    const insufficient =
        amountExceedsBalance ||
        (!!source &&
            routeSpend !== undefined &&
            new BigNumber(routeSpend.toString()).shiftedBy(-source.decimals).gt(sourceBalance));
    // A quote is on its way: either the request is in flight, or a valid
    // amount is still sitting in the debounce window before the request fires.
    const quoteBusy =
        quote.isFetching ||
        (!!source && amount !== debouncedAmount && !!sourceUnits(amount, source.decimals));
    // Settled failure for the currently typed amount — otherwise states
    // flash while the user is still typing or a request is in flight.
    const quoteSettled = !!units && amount === debouncedAmount && !quoteBusy;
    const quoteFailed = quoteSettled && quote.isError;
    // An empty quote with a provider reason other than `no_route` (amount
    // below the provider minimum, region blocked, provider down) is not a
    // pair that has no route, and the user is told that reason, like on iOS.
    const emptyQuote = quoteSettled && quote.isFetched && !quote.isError && !route;
    const providerErrorCode = emptyQuote
        ? crossSwapProviderErrorCode(quote.data?.providerErrors)
        : undefined;
    const refusalCode = providerErrorCode !== 'no_route' ? providerErrorCode : undefined;
    const providerRefused = refusalCode !== undefined;
    // `pair_not_allowed` is the backend refusing the direction outright —
    // the same terminal state as a quote that returned no routes. Other
    // failures are transient and get the generic error line instead, so
    // the user isn't sent hunting for an amount that would never work.
    const noRoute =
        (emptyQuote && !providerRefused) || (quoteFailed && isPairNotAllowedError(quote.error));
    const quoteUnavailable = quoteFailed || noRoute || providerRefused;
    const quoteUnavailableMessage = noRoute
        ? t('multichain_swap_no_route')
        : refusalCode
        ? t(PROVIDER_ERROR_MESSAGE_KEY[refusalCode])
        : t('multichain_swap_quote_unavailable');
    const receiveValue =
        route && destination
            ? new BigNumber(route.estimatedDestinationAmount).shiftedBy(-destination.decimals)
            : undefined;
    const receiveAmount = receiveValue ? formatAmount(receiveValue) : '';
    const sourceFiat = sourceWallet?.price
        ? formatFiatCurrency(fiat, new BigNumber(amount || 0).multipliedBy(sourceWallet.price))
        : undefined;
    const destinationWallet = walletAssetOf(destination);
    const destinationBalance = walletBalance(destinationWallet);
    // An asset the wallet doesn't list has no wallet price, so, as on iOS, it
    // falls back to the route's USD price, converted to the display currency
    // through the source asset's wallet-vs-route price ratio.
    const usdFiatRate =
        fiat === FiatCurrencies.USD
            ? new BigNumber(1)
            : sourceWallet?.price && route?.sourceUsdPrice
            ? sourceWallet.price.dividedBy(route.sourceUsdPrice)
            : undefined;
    const destinationPrice =
        destinationWallet?.price ??
        (route?.destinationUsdPrice && usdFiatRate
            ? usdFiatRate.multipliedBy(route.destinationUsdPrice)
            : undefined);
    const destinationFiat =
        destinationPrice && receiveValue
            ? formatFiatCurrency(fiat, receiveValue.multipliedBy(destinationPrice))
            : undefined;

    const approvalMode = unlimitedApproval
        ? CrossSwapApprovalMode.Max
        : CrossSwapApprovalMode.Exact;
    const confirming = screen === 'confirm' || screen === 'warning';
    const prepared = usePrepareCrossSwap(route, approvalMode, confirming);
    // A TON jetton swap is priced and sent through the legacy TON senders,
    // which is what lets Battery pay its fee, and so is a TON route split over
    // several messages, which chain-kit can't sign as one transaction; every
    // other swap is priced and broadcast by chain-kit in the chain coin.
    const nativeTon = useNativeAsset('ton');
    const sourceNative = useNativeAsset(
        source ? parseAssetIdHead(swapAssetWalletId(source.assetId)).network : ''
    );
    const relay = useMultichainSwapTonRelay({
        source,
        destination,
        route,
        prepared: prepared.data,
        unlimitedApproval,
        tonBalance: nativeTon ? new BigNumber(nativeTon.balance) : undefined,
        enabled: confirming
    });
    const estimation = useEstimateCrossSwap({
        sourceAsset: source,
        destinationAsset: destination,
        route,
        prepared: prepared.data,
        unlimitedApproval,
        isMax,
        enabled: confirming && !relay.relayed
    });
    const execute = useExecuteCrossSwap();
    const sendFailureText = useSendFailureText();
    const trackTransactionSent = useTrackTransactionSent();
    const track = useAnalyticsTrack();
    const swapAnalytics = useSwapAnalytics();
    useTrackSwapOpen(isOpen);
    const analyticsPair: SwapAnalyticsPair | undefined =
        source && destination
            ? {
                  asset_from: toSwapAnalyticsAssetId(source.assetId),
                  asset_to: toSwapAnalyticsAssetId(destination.assetId),
                  is_max: isMax
              }
            : undefined;

    // Auto-recover a prepare that died on a stale route: a route id lives
    // about a minute, so a confirmation opened near the end of the window
    // would otherwise dead-end while amount and pair are still valid.
    // Fresh quote → new route id re-keys `prepared`; a same-id quote gets
    // an explicit re-prepare. The ladder is the hard bound — once spent,
    // the failure surfaces on the Try Again control.
    const refetchQuoteRef = useRef(quote.refetch);
    refetchQuoteRef.current = quote.refetch;
    const refetchPreparedRef = useRef(prepared.refetch);
    refetchPreparedRef.current = prepared.refetch;
    const prepareRetryCount = useRef(0);
    useEffect(() => {
        if (!confirming || prepared.data) {
            prepareRetryCount.current = 0;
            return;
        }
        if (
            !prepared.isError ||
            !isPrepareErrorRouteBound(prepared.error) ||
            prepareRetryCount.current >= PREPARE_RETRY_DELAYS_MS.length
        ) {
            return;
        }
        const delay = PREPARE_RETRY_DELAYS_MS[prepareRetryCount.current];
        prepareRetryCount.current += 1;
        const timer = setTimeout(() => {
            void refetchQuoteRef.current().then(() => refetchPreparedRef.current());
        }, delay);
        return () => clearTimeout(timer);
    }, [confirming, prepared.data, prepared.isError, prepared.error, prepared.errorUpdatedAt]);

    // A quote that settles without a route while confirming:
    // - after a slippage pick on this step, the pick is reverted, as on iOS,
    //   with the provider's reason toasted when it gives one;
    // - an empty answer or a refused pair is terminal, so the user goes back
    //   to the form, which names the reason next to the amount;
    // - any other failure is transient and stays here behind Try Again.
    const slippageRollbackRef = useRef<{ from: number; to: number }>();
    const selectConfirmSlippage = (bps: number) => {
        if (bps === slippageBps) return;
        slippageRollbackRef.current = { from: slippageBps, to: bps };
        setSlippageBps(bps);
    };
    useEffect(() => {
        if (!confirming) {
            slippageRollbackRef.current = undefined;
            return;
        }
        if (quote.isFetching) return;
        const rollback = slippageRollbackRef.current;
        slippageRollbackRef.current = undefined;
        if (liveRoute) return;
        const code = quote.isError
            ? undefined
            : crossSwapProviderErrorCode(quote.data?.providerErrors);
        if (rollback?.to === slippageBps) {
            setSlippageBps(rollback.from);
            if (code) {
                toast(
                    t(
                        code === 'no_route'
                            ? 'multichain_swap_no_route'
                            : PROVIDER_ERROR_MESSAGE_KEY[code]
                    )
                );
            }
            return;
        }
        if (quote.isError ? isPairNotAllowedError(quote.error) : quote.isFetched) {
            setScreen('form');
        }
    }, [
        confirming,
        quote.isFetching,
        quote.isError,
        quote.isFetched,
        quote.error,
        quote.data,
        liveRoute,
        slippageBps,
        toast,
        t
    ]);

    const pickAsset = (asset: CrossSwapAsset, kind: 'source' | 'destination') => {
        if (kind === 'source') {
            if (destination?.assetId === asset.assetId) setDestination(source);
            setSource(asset);
        } else {
            if (source?.assetId === asset.assetId) setSource(destination);
            setDestination(asset);
        }
        setScreen('form');
        setPickerFilter({ query: '' });
    };

    const swapAssets = () => {
        if (!source || !destination) return;
        // Switching straight back restores what was typed rather than the
        // quote's receive amount, which is net of fees and slippage and would
        // shrink the amount on every round trip.
        const isSwitchBack =
            lastSwitch?.sourceId === source.assetId &&
            lastSwitch.destinationId === destination.assetId &&
            lastSwitch.amount === amount;
        const next = isSwitchBack ? lastSwitch.replaced : receiveValue?.toFixed() ?? '';
        setSource(destination);
        setDestination(source);
        setAmount(next);
        setLastSwitch({
            sourceId: destination.assetId,
            destinationId: source.assetId,
            amount: next,
            replaced: amount
        });
    };

    const setMaxAmount = () => {
        if (!source || sourceBalance.lte(0)) return;
        const reserve = MAX_RESERVE[source.assetId] ?? 0;
        const max = BigNumber.max(sourceBalance.minus(reserve), 0);
        if (max.lte(0)) {
            // The whole balance sits inside the fee reserve — a silent
            // `0` reads as a dead MAX button.
            toast(
                t('multichain_swap_ton_max_unavailable', {
                    amount: formatAmount(reserve),
                    symbol: source.symbol
                })
            );
            return;
        }
        setAmount(max.toFixed());
        setMaxFill(max.toFixed());
    };

    const performSwap = () => {
        if (!source || !destination || !route || !prepared.data || !analyticsPair) return;
        const relaySelected = relay.relayed ? relay.selected : undefined;
        if (relay.relayed && (!relay.payload || !relaySelected?.estimation)) return;
        const analyticsRoute: SwapAnalyticsRoute = {
            ...analyticsPair,
            fee_asset: relaySelected ? toAnalyticsFeeAsset(relaySelected.method.type) : 'coin',
            provider_name: route.aggregator
        };
        swapAnalytics.confirm(analyticsRoute);
        const sendSession = startSwapRedOperation(track, 'send', {
            from_asset: analyticsRoute.asset_from,
            to_asset: analyticsRoute.asset_to,
            from_amount: amount,
            fee_paid_in: analyticsRoute.fee_asset,
            provider: analyticsRoute.provider_name
        });
        const onFailed = (error: unknown) => {
            finishSwapSendWithError(sendSession, error);
            if (!isUserCancellation(error)) swapAnalytics.failed(analyticsRoute, error);
        };
        const onSent = () => {
            sendSession.finish('success', { stage: 'send' });
            swapAnalytics.success(analyticsRoute);
            const { asset_from: asset, asset_to: to_asset } = analyticsRoute;
            trackTransactionSent({
                category: 'swap',
                category_detail:
                    assetIdChain(asset) === assetIdChain(to_asset) ? 'onchain' : 'cross_chain',
                asset,
                to_asset,
                amount: new BigNumber(amount || 0).toNumber(),
                fee_asset: analyticsRoute.fee_asset
            });
            setScreen('done');
        };
        if (relaySelected?.estimation && relay.payload) {
            relay.send.mutate(
                {
                    sourceAsset: source,
                    destinationAsset: destination,
                    routeId: prepared.data.routeId,
                    providerRouteId: prepared.data.providerRouteId,
                    route,
                    payload: relay.payload,
                    method: relaySelected.method,
                    estimation: relaySelected.estimation
                },
                { onSuccess: onSent, onError: onFailed }
            );
            return;
        }
        execute.mutate(
            {
                sourceAsset: source,
                destinationAsset: destination,
                prepared: prepared.data,
                route,
                unlimitedApproval,
                isMax
            },
            { onSuccess: onSent, onError: onFailed }
        );
    };

    // Chain-kit's estimate doesn't check that the coin covers the fee, and it
    // names a short balance only once the broadcast fails, so sufficiency is
    // checked deterministically before sending, as on the send confirm: the
    // chain coin must cover the fee plus whatever coin value the payload
    // sends, which can exceed the typed amount and is sent even when the
    // source is a token. Relayed swaps price and check their fee via the
    // relay.
    // A coin the wallet doesn't list has a zero balance — the backend hides
    // zero-balance assets — and its decimals and symbol then come from the
    // fee estimate, or from the source when the source is that coin. The
    // coin the payload attaches is known before the fee: it alone can exceed
    // the balance, and such a swap fails to estimate rather than reporting
    // the shortfall, as does a fee estimate on an empty coin balance.
    const coinSpend = source ? swapCoinSpend(source, prepared.data?.payloads) : undefined;
    const coinShortfall = ((): CoinShortfall | undefined => {
        if (relay.relayed || !source) return undefined;
        const sourceIsCoin = isChainCoin(source);
        const decimals =
            sourceNative?.decimals ??
            estimation.data?.feeDecimals ??
            (sourceIsCoin ? source.decimals : undefined);
        const symbol =
            sourceNative?.symbol ??
            estimation.data?.feeSymbol ??
            (sourceIsCoin ? source.symbol : undefined);
        if (decimals === undefined || symbol === undefined) return undefined;
        const balance = sourceNative
            ? new BigNumber(sourceNative.balance).shiftedBy(-sourceNative.decimals)
            : new BigNumber(0);
        const spend =
            coinSpend !== undefined
                ? new BigNumber(coinSpend.toString()).shiftedBy(-decimals)
                : new BigNumber(sourceIsCoin ? amount || 0 : 0);
        const required = estimation.data
            ? spend.plus(
                  new BigNumber(estimation.data.feeAmount.toString()).shiftedBy(
                      -estimation.data.feeDecimals
                  )
              )
            : spend;
        const short =
            !!estimation.data?.reserveInsufficient ||
            required.gt(balance) ||
            (estimation.isError && balance.lte(0));
        if (!short) return undefined;
        return {
            required: formatAmount(required, { unit: symbol }),
            balance: formatAmount(balance, { unit: symbol }),
            symbol,
            assetId: sourceNative?.assetId ?? chainCoinWalletId(source)
        };
    })();
    const nativeFeeShort = coinShortfall !== undefined;
    // A fee chain-kit couldn't estimate is not shown: the flat default that
    // stands in is a multiple of the real cost and would be what the swap is
    // broadcast with. As on iOS the estimate counts as failed, except for a
    // wallet that can't cover even the default, which is told so instead.
    const feeUnestimated = !!estimation.data && !estimation.data.estimated && !nativeFeeShort;
    // A failed quote refresh, prepare, fee estimate, or execution relabels
    // the confirm control to Try Again. Retrying resets the failure and
    // refreshes the quote (and the failed step) behind it — re-submitting the
    // same prepared payloads would fail deterministically once they expire.
    const quoteRefreshFailed = confirming && quote.isError && !isPairNotAllowedError(quote.error);
    const confirmFailed = !!(
        quoteRefreshFailed ||
        prepared.error ||
        (estimation.error && !nativeFeeShort) ||
        feeUnestimated ||
        execute.error ||
        relay.allFailed ||
        relay.send.error
    );
    const sendError = execute.error || relay.send.error || estimation.error || prepared.error;
    const sendErrorKey = prepareErrorMessageKey(sendError);
    const sending = execute.isLoading || relay.send.isLoading;
    // While a refresh is in flight the route on screen may be about to change
    // under the user, so nothing is sent until the new answer lands — the
    // fresh route then holds the controls until its own fee is priced.
    const quoteRefreshing = quote.isFetching;
    const confirmRetryBusy =
        quote.isFetching || prepared.isFetching || estimation.isFetching || relay.pending;
    const retryConfirm = () => {
        const preparedFailed = prepared.isError;
        const estimationFailed = estimation.isError || feeUnestimated;
        const relayFailed = relay.allFailed;
        execute.reset();
        relay.send.reset();
        void quote.refetch().then(() => {
            if (preparedFailed) void refetchPreparedRef.current();
            else if (estimationFailed) void estimation.refetch();
            else if (relayFailed) relay.refetchAll();
        });
    };

    const valueDifferenceBps = route?.valueDifferenceBps;
    const severity = valueDifferenceSeverity(valueDifferenceBps);
    // The quote keeps refreshing behind the confirm screen, so every confirm
    // is checked against the route it would send, like the natives' swipe.
    const onConfirm = () => {
        if (severity !== 'none') {
            setScreen('warning');
            return;
        }
        performSwap();
    };
    // The failure line and Try Again live on the confirm screen, and so does
    // the wait for a fresh route once the warned one has expired.
    useEffect(() => {
        if (screen === 'warning' && (confirmFailed || !route)) setScreen('confirm');
    }, [screen, confirmFailed, route]);

    // The approval mode only matters when the route ships a separate
    // `approval` payload, the one leg the swap actually broadcasts as an
    // approve; `requires_token_approval` on a main payload is not acted on
    // by any client, so it must not surface the toggle. The prepare call is
    // re-run when the mode flips and has no previous data in the meantime,
    // so the toggle would blink out on every change unless the last known
    // answer is kept until a new plan arrives.
    const [approvalRequired, setApprovalRequired] = useState(false);
    useEffect(() => {
        if (!confirming) {
            setApprovalRequired(false);
        } else if (prepared.data) {
            setApprovalRequired(
                prepared.data.payloads.some(p => p.kind === CrossSwapPayloadKind.Approval)
            );
        }
    }, [confirming, prepared.data]);
    const canContinue =
        !!source &&
        !!destination &&
        !!route &&
        !!units &&
        amount === debouncedAmount &&
        !quote.isFetching &&
        !insufficient &&
        !belowMinimum &&
        new Date(route.dateExpire).getTime() > Date.now();
    const rateValue =
        source && destination && route && units
            ? new BigNumber(route.estimatedDestinationAmount)
                  .shiftedBy(-destination.decimals)
                  .div(new BigNumber(units).shiftedBy(-source.decimals))
            : undefined;
    const rate =
        source && destination && rateValue
            ? rateInverted
                ? `1 ${destination.symbol} ≈ ${formatAmount(new BigNumber(1).div(rateValue))} ${
                      source.symbol
                  }`
                : `1 ${source.symbol} ≈ ${formatAmount(rateValue)} ${destination.symbol}`
            : '—';
    const feeLoading = !estimation.data && (estimation.isLoading || prepared.isLoading);
    const fee =
        estimation.data && !feeUnestimated
            ? `≈ ${formatAmount(
                  new BigNumber(estimation.data.feeAmount.toString()).shiftedBy(
                      -estimation.data.feeDecimals
                  )
              )} ${estimation.data.feeSymbol}`
            : feeLoading
            ? '0'
            : t('send_fee_unavailable');
    const feeReady = relay.relayed
        ? !!relay.selected?.estimation && !relay.selected.insufficient
        : !!estimation.data && !nativeFeeShort;

    const feeText = useFeeTextFormatter();
    const addFunds = useLeaveForAddFunds(onClose);
    // As on iOS, the shortfall sheet opens once per visit to the confirm
    // step. It keeps the figures it opened with, so a re-prepare behind it
    // doesn't blink it shut.
    const [shownShortfall, setShownShortfall] = useState<CoinShortfall | null>();
    useEffect(() => {
        if (!confirming) setShownShortfall(undefined);
        else if (coinShortfall && shownShortfall === undefined) setShownShortfall(coinShortfall);
    }, [confirming, coinShortfall, shownShortfall]);

    // Once the done state has played out the flow closes and History opens,
    // where the swap shows up pending. The callbacks are read through a ref
    // so the parent re-render triggered by the post-swap balance refetch
    // doesn't restart the timer.
    const navigate = useNavigate();
    const leaveForHistory = useRef(() => {});
    leaveForHistory.current = () => {
        onClose();
        navigate(MultichainRoute.history);
    };
    useEffect(() => {
        if (screen !== 'done') return undefined;
        const handle = window.setTimeout(() => leaveForHistory.current(), 1800);
        return () => window.clearTimeout(handle);
    }, [screen]);
    const relayFee = relay.selected?.estimation
        ? feeText(relay.selected.estimation.fee)
        : undefined;
    // Under the fee: the shortfall when the picked method can't pay, else
    // the route's own time estimate, as on iOS.
    const relayFeeDescription = relay.selected?.insufficient
        ? relay.selected.method.type === 'external'
            ? t('multichain_swap_insufficient_fee_token', { symbol: nativeTon?.symbol ?? '' })
            : t('send_screen_steps_amount_insufficient_balance')
        : route
        ? formatEstimatedTime(t, route)
        : undefined;
    // As on iOS, opening the picker re-prices the methods that failed to
    // price, so a transient failure only hides a method until the next open.
    const openFeePicker = () => {
        relay.estimates.filter(e => e.isError).forEach(e => e.refetch());
        setFeeSheetOpen(true);
    };
    const feeOptions = relay.usable.map(estimate => {
        const parts = estimate.estimation ? feeText(estimate.estimation.fee) : undefined;
        const battery = estimate.method.type === 'battery';
        return {
            key: estimate.method.type,
            icon: battery ? (
                batteryFeeIcon
            ) : nativeTon ? (
                <AssetIcon asset={nativeTon} size={44} withChainBadge={false} />
            ) : null,
            title: battery ? t('battery_title') : nativeTon?.symbol ?? '',
            subtitle:
                !parts && estimate.insufficient ? (
                    t('send_screen_steps_amount_insufficient_balance')
                ) : !parts ? (
                    <Loader size="xSmall" />
                ) : parts.fiatText ? (
                    `≈ ${parts.fiatText} (${parts.amount})`
                ) : (
                    `≈ ${parts.amount}`
                ),
            disabled: estimate.insufficient,
            // The battery screen stacks over the confirm as a second layer,
            // so the quoted swap survives a recharge; the estimates re-price
            // on return. Adding funds leaves for the home flow instead.
            action: !estimate.insufficient
                ? undefined
                : battery
                ? {
                      label: t('battery_recharge_by_crypto_title'),
                      onClick: () => setBatteryOpen(true)
                  }
                : nativeTon
                ? { label: t('wallet_add_funds'), onClick: () => addFunds(nativeTon.assetId) }
                : undefined
        };
    });
    const minimumReceived = route
        ? swapMinimumReceiveAmount(route, prepared.data?.payloads ?? route.payloads)
        : undefined;
    const minimumReceivedLoading = !route || (confirming && prepared.isLoading);
    const minimumReceivedFiat =
        destinationPrice && minimumReceived && destination
            ? formatFiatCurrency(
                  fiat,
                  new BigNumber(minimumReceived)
                      .shiftedBy(-destination.decimals)
                      .multipliedBy(destinationPrice)
              )
            : undefined;

    // Back from the background or behind a failed refresh, the confirm step
    // masks every quoted figure instead of showing a price it can't stand by.
    const quoteMask = useSkeletonMask(!route);

    const title =
        screen === 'pick-source' || screen === 'pick-destination'
            ? t('send_choose_asset_title')
            : screen === 'confirm' || screen === 'done'
            ? t('multichain_swap_confirm')
            : screen === 'warning'
            ? undefined
            : t('swap_title');

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onBack={
                screen === 'pick-source' || screen === 'pick-destination'
                    ? () => setScreen('form')
                    : screen === 'confirm'
                    ? () => setScreen('form')
                    : screen === 'warning'
                    ? () => setScreen('confirm')
                    : undefined
            }
            topBarTitle={title}
            variant="content"
            mobileHeight="full"
        >
            {screen === 'form' && (
                <div className="flex flex-1 flex-col">
                    {assetsUnavailable ? (
                        <div className="flex flex-1 flex-col items-center justify-center px-8 py-20 text-center">
                            <IcExclamationmarkCircle16 className="mb-4 size-14 text-textSecondary" />
                            <h3 className="text-h3 text-textPrimary">{t('error_occurred')}</h3>
                            <p className="mt-1 text-body1 text-textSecondary">
                                {t('please_try_again_later')}
                            </p>
                            <Button
                                variant="secondary"
                                size="small"
                                className="mt-6"
                                onClick={() => assetsQuery.refetch()}
                            >
                                {t('try_again')}
                            </Button>
                        </div>
                    ) : assetsQuery.isLoading || !source || !destination ? (
                        <SkeletonScope loading>
                            <div className="flex flex-col">
                                <div className="relative flex flex-col gap-2">
                                    <MultichainSwapAmountCard
                                        label={t('swap_send')}
                                        asset={PLACEHOLDER_SWAP_ASSET}
                                        amount=""
                                        onAsset={() => undefined}
                                        balance={0}
                                        fiat="0"
                                    />
                                    <span
                                        aria-hidden
                                        className="absolute left-1/2 top-[calc(50%-20px)] z-10 block size-10 -translate-x-1/2 rounded-full bg-buttonTertiaryBackground"
                                    />
                                    <MultichainSwapAmountCard
                                        label={t('swap_receive')}
                                        asset={PLACEHOLDER_SWAP_ASSET}
                                        amount=""
                                        onAsset={() => undefined}
                                        balance={0}
                                        fiat="0"
                                    />
                                </div>
                                <div className="flex items-center justify-center py-3">
                                    <SwapRateBar />
                                </div>
                            </div>
                        </SkeletonScope>
                    ) : (
                        <div className="flex flex-col">
                            <div className="relative flex flex-col gap-2">
                                <MultichainSwapAmountCard
                                    label={t('swap_send')}
                                    asset={source}
                                    amount={amount}
                                    onAmount={setAmount}
                                    onAsset={() => setScreen('pick-source')}
                                    onMax={sourceBalance.gt(0) ? setMaxAmount : undefined}
                                    balance={sourceBalance}
                                    fiat={sourceFiat ?? formatFiatCurrency(fiat, 0)}
                                    error={
                                        insufficient && !belowMinimum
                                            ? t('swap_not_enough_funds')
                                            : undefined
                                    }
                                />
                                <button
                                    type="button"
                                    aria-label={t('multichain_swap_switch_assets')}
                                    onClick={swapAssets}
                                    className="absolute left-1/2 top-[calc(50%-20px)] z-10 flex size-10 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full bg-buttonTertiaryBackground text-buttonTertiaryForeground transition-colors duration-100 hover:bg-buttonTertiaryBackgroundHighlighted"
                                >
                                    <IcSwapVertical16 className="size-4" />
                                </button>
                                <MultichainSwapAmountCard
                                    label={t('swap_receive')}
                                    asset={destination}
                                    amount={quoteBusy || quoteUnavailable ? '' : receiveAmount}
                                    placeholder={
                                        quoteUnavailable ? t('multichain_swap_no_quote') : undefined
                                    }
                                    onAsset={() => setScreen('pick-destination')}
                                    balance={destinationBalance}
                                    fiat={destinationFiat ?? formatFiatCurrency(fiat, 0)}
                                />
                            </div>
                            {/* Rate line, following the native apps: empty until
                                an amount is entered, the fetching notice while a
                                quote is in flight, the failure reason when no
                                quote came back, and the invertible rate once one
                                lands. The row holds its height either way so the
                                footer doesn't shift. */}
                            <div className="flex min-h-5 items-center justify-center py-3 text-body2 text-textSecondary">
                                {quoteBusy ? (
                                    <span className="flex items-center gap-1.5">
                                        {t('multichain_swap_quote_fetching')}
                                        <Loader size="small" />
                                    </span>
                                ) : quoteUnavailable ? (
                                    <span className="text-center text-accentRed">
                                        {quoteUnavailableMessage}
                                    </span>
                                ) : (
                                    rateValue && (
                                        <button
                                            type="button"
                                            onClick={() => setRateInverted(inverted => !inverted)}
                                            className="flex cursor-pointer items-center gap-2 transition-colors duration-100 hover:text-textPrimary"
                                        >
                                            {rate}
                                            <IcSwap16 className="size-4" />
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                    <ModalFooterPortal>
                        <ModalFooter>
                            <Button
                                variant="primaryBlue"
                                size="large"
                                fullWidth
                                disabled={!canContinue}
                                onClick={() => {
                                    if (analyticsPair) swapAnalytics.click(analyticsPair);
                                    setScreen('confirm');
                                }}
                            >
                                {belowMinimum && source && minimumAmount !== undefined
                                    ? t('multichain_swap_minimum_amount', {
                                          amount: formatAmount(minimumAmount, {
                                              unit: source.symbol
                                          })
                                      })
                                    : t('continue')}
                            </Button>
                        </ModalFooter>
                    </ModalFooterPortal>
                </div>
            )}

            {(screen === 'pick-source' || screen === 'pick-destination') && (
                <AssetPicker
                    assets={supported}
                    walletAssets={walletAssets}
                    counterpart={screen === 'pick-source' ? destination : source}
                    selected={screen === 'pick-source' ? source : destination}
                    requirePositiveBalance={screen === 'pick-source'}
                    onSelect={asset =>
                        pickAsset(asset, screen === 'pick-source' ? 'source' : 'destination')
                    }
                    onSearchChange={(query, chainId) => setPickerFilter({ query, chainId })}
                    searchResults={searchQuery.data}
                    searchError={searchQuery.isError}
                    onSearchRetry={() => searchQuery.refetch()}
                />
            )}

            {(screen === 'confirm' || screen === 'done') && source && destination && (
                <div className="flex flex-1 flex-col">
                    <div className="relative flex flex-col gap-2">
                        <div className="flex min-h-[78px] items-center gap-3 rounded-medium bg-buttonSecondaryBackground px-4">
                            <SwapAssetImage asset={source} />
                            <div>
                                <div className="text-body2 text-textSecondary">
                                    {t('swap_send')}
                                </div>
                                <div className="text-num3 text-textPrimary">
                                    {formatAmount(amount, { unit: source.symbol, exact: true })}
                                </div>
                            </div>
                        </div>
                        <div className="flex min-h-[78px] items-center gap-3 rounded-medium bg-buttonSecondaryBackground px-4">
                            <SwapAssetImage asset={destination} />
                            <div>
                                <div className="text-body2 text-textSecondary">
                                    {t('swap_receive')}
                                </div>
                                <div
                                    {...quoteMask({ w: 100 })}
                                    className="text-num3 text-textPrimary"
                                >
                                    {receiveAmount} {destination.symbol}
                                </div>
                            </div>
                        </div>
                        <span className="absolute right-10 top-[calc(50%-20px)] flex size-10 items-center justify-center rounded-full bg-buttonTertiaryBackground text-buttonTertiaryForeground">
                            <IcArrowDown16 className="size-4" />
                        </span>
                    </div>

                    {/* No overflow-hidden: the hint bubbles extend above the card. */}
                    <div className="mt-2 rounded-medium bg-backgroundContent [--tk-skeleton-fill:var(--tk-background-content-tint)]">
                        <DetailRow
                            label={t('multichain_swap_rate')}
                            value={rate}
                            loading={!route}
                            trailing={
                                screen === 'confirm' && (
                                    <QuoteRefreshRing
                                        key={`${quote.dataUpdatedAt}-${quote.errorUpdatedAt}`}
                                        fetching={quote.isFetching}
                                    />
                                )
                            }
                        />
                        <DetailRow
                            label={t('swap_slippage')}
                            value={
                                screen === 'confirm' ? (
                                    <SlippageSelect
                                        label={t('swap_slippage')}
                                        valueBps={slippageBps}
                                        optionsBps={slippageOptionsBps}
                                        onChange={selectConfirmSlippage}
                                    />
                                ) : (
                                    formatPercent(slippageBps / 100)
                                )
                            }
                        >
                            <MultichainHint
                                label={t('swap_slippage')}
                                text={t('swap_slippage_description')}
                            />
                        </DetailRow>
                        <DetailRow
                            label={t('swap_minimum_received')}
                            value={
                                minimumReceived && !minimumReceivedLoading
                                    ? `≈ ${formatUnits(minimumReceived, destination.decimals)} ${
                                          destination.symbol
                                      }`
                                    : '0'
                            }
                            loading={minimumReceivedLoading}
                            description={minimumReceivedFiat}
                        />
                        {valueDifferenceBps !== undefined && (
                            <ValueDifferenceRow
                                label={t('multichain_swap_value_difference')}
                                bps={valueDifferenceBps}
                            >
                                <MultichainHint
                                    label={t('multichain_swap_value_difference')}
                                    text={t('multichain_swap_value_difference_info')}
                                />
                            </ValueDifferenceRow>
                        )}
                        {relay.relayed ? (
                            <DetailRow
                                label={t('send_network_fee')}
                                value={
                                    <NetworkFeeValue
                                        loading={
                                            !route ||
                                            (!relay.allFailed && (relay.pending || !relay.selected))
                                        }
                                        error={!!route && relay.allFailed}
                                        onRetry={relay.refetchAll}
                                        value={
                                            relay.canPick ? relayFee?.row.value : relayFee?.amount
                                        }
                                        unit={relay.canPick ? relayFee?.row.unit : undefined}
                                        onChange={
                                            relay.canPick && screen === 'confirm'
                                                ? openFeePicker
                                                : undefined
                                        }
                                    />
                                }
                                description={relayFeeDescription}
                                descriptionAccent={relay.selected?.insufficient ? 'red' : undefined}
                            />
                        ) : (
                            <DetailRow
                                label={t('send_network_fee')}
                                value={fee}
                                loading={feeLoading || !route}
                                description={
                                    coinShortfall
                                        ? t('multichain_swap_insufficient_fee_token', {
                                              symbol: coinShortfall.symbol
                                          })
                                        : route
                                        ? formatEstimatedTime(t, route)
                                        : undefined
                                }
                                descriptionAccent={nativeFeeShort ? 'red' : undefined}
                            />
                        )}
                    </div>

                    {relay.relayed && (
                        <>
                            <SendFeeMethodSheet
                                isOpen={isOpen && feeSheetOpen}
                                onClose={() => setFeeSheetOpen(false)}
                                options={feeOptions}
                                selected={relay.selectedType}
                                onSelect={relay.setSelectedType}
                            />
                            <BatteryModal
                                isOpen={isOpen && batteryOpen}
                                onClose={() => setBatteryOpen(false)}
                                afterClose={relay.refetchAll}
                                from="wallet"
                                layered
                            />
                        </>
                    )}

                    {shownShortfall && (
                        <InsufficientFundsSheet
                            isOpen={isOpen && screen === 'confirm'}
                            onClose={() => setShownShortfall(null)}
                            required={shownShortfall.required}
                            balance={shownShortfall.balance}
                            buySymbol={shownShortfall.symbol}
                            onBuy={() => addFunds(shownShortfall.assetId)}
                        />
                    )}

                    {screen === 'confirm' && approvalRequired && (
                        <div className="mt-auto flex items-center justify-center gap-1 pb-3 pt-6 text-textSecondary">
                            <Checkbox
                                checked={unlimitedApproval}
                                onChange={setUnlimitedApproval}
                                disabled={sending}
                                size="s"
                            >
                                <span className="text-body2 text-textSecondary">
                                    {t('multichain_swap_avoid_extra_fees')}
                                </span>
                            </Checkbox>
                            <MultichainHint
                                label={t('multichain_swap_avoid_extra_fees')}
                                text={t('multichain_swap_avoid_extra_fees_info', {
                                    symbol: source.symbol
                                })}
                                align="end"
                            />
                        </div>
                    )}

                    {screen === 'confirm' && confirmFailed && (
                        <div className="pb-2 text-center text-body2 text-accentRed">
                            {quoteRefreshFailed && !sendError
                                ? t('multichain_swap_quote_refresh_failed')
                                : sendErrorKey
                                ? t(sendErrorKey)
                                : sendFailureText(sendError)}
                        </div>
                    )}

                    <ModalFooterPortal>
                        <ModalFooter>
                            {screen === 'done' ? (
                                <div className="flex h-14 items-center justify-center gap-2 text-label2 text-accentGreen">
                                    <IcCheckmarkCircle32 className="size-8" />
                                    {t('send_done')}
                                </div>
                            ) : confirmFailed ? (
                                // A failed prepare/estimate/execute unlocks a
                                // retry that refreshes the quote and fee behind
                                // it, instead of freezing the confirm control.
                                <Button
                                    variant="primaryBlue"
                                    size="large"
                                    fullWidth
                                    loading={confirmRetryBusy}
                                    onClick={retryConfirm}
                                >
                                    {t('try_again')}
                                </Button>
                            ) : (
                                <Button
                                    variant={severity === 'danger' ? 'primaryRed' : 'primaryBlue'}
                                    size="large"
                                    fullWidth
                                    loading={sending}
                                    disabled={
                                        !prepared.data ||
                                        !feeReady ||
                                        sending ||
                                        insufficient ||
                                        quoteRefreshing
                                    }
                                    className={
                                        severity === 'warning'
                                            ? CONFIRM_WARNING_BUTTON_CLASS
                                            : undefined
                                    }
                                    onClick={onConfirm}
                                >
                                    {t('confirm')}
                                </Button>
                            )}
                        </ModalFooter>
                    </ModalFooterPortal>
                </div>
            )}

            {screen === 'warning' && (
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                    {severity === 'danger' ? (
                        <IcExclamationmarkTriangle84 className="mb-5 size-[84px] text-accentRed" />
                    ) : (
                        <IcExclamationmarkCircle84 className="mb-5 size-[84px] text-accentOrange" />
                    )}
                    <h2 className="text-h2 text-textPrimary">
                        {t('multichain_swap_value_difference_high_title')}
                    </h2>
                    <p className="mt-2 max-w-[360px] text-body1 text-textSecondary">
                        {t('multichain_swap_value_difference_high_body')}
                    </p>
                    <ModalFooterPortal>
                        <ModalFooter>
                            <Button
                                variant="secondary"
                                size="large"
                                fullWidth
                                loading={sending}
                                disabled={quoteRefreshing}
                                className={
                                    severity === 'danger' ? 'text-accentRed' : 'text-accentOrange'
                                }
                                onClick={performSwap}
                            >
                                {t('multichain_swap_value_difference_high_action')}
                            </Button>
                            <Button
                                variant="secondary"
                                size="large"
                                fullWidth
                                onClick={() => setScreen('confirm')}
                            >
                                {t('multichain_swap_back')}
                            </Button>
                        </ModalFooter>
                    </ModalFooterPortal>
                </div>
            )}
        </Modal>
    );
};
