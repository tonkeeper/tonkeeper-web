import { useMemo } from 'react';

import { AnalyticsEvent } from '@tonkeeper/core/dist/analytics';
import { normalizeAnalyticsAssetId } from '@tonkeeper/core/dist/analytics/asset-id';
import type { RampQuote } from '@tonkeeper/core/dist/onrampApi';

import { useActiveAccount } from '../../state/wallet';
import { useAnalyticsTrack } from './index';

type DepositStarted = Extract<AnalyticsEvent, { eventName: 'deposit_started' }>;
type DepositOptionClick = Extract<AnalyticsEvent, { eventName: 'deposit_option_click' }>;

export type RampSource = DepositStarted['from'];

const RAMP_SOURCES: Record<RampSource, true> = {
    wallet_screen: true,
    jetton_screen: true,
    deep_link: true,
    qr_code: true,
    history_screen: true,
    browser: true,
    collectibles: true,
    perps: true,
    walletconnect: true,
    tonconnect: true,
    staking: true,
    migration: true,
    other: true
};

/** Reads a `RampSource` carried through a URL, e.g. the home's `?from=`. */
export const toRampSource = (value: string | null): RampSource | undefined =>
    value !== null && Object.prototype.hasOwnProperty.call(RAMP_SOURCES, value)
        ? (value as RampSource)
        : undefined;
export type AddFundsOption = DepositOptionClick['add_funds_option'];

/**
 * Everything the fiat-purchase events carry from step to step. Fields are
 * optional because each step only knows what has been chosen so far; the
 * emitters below default the not-yet-known ones to empty strings, which is
 * how the native apps report them too.
 */
export interface DepositRampContext {
    from: RampSource;
    /** Backend asset id of the crypto being bought. */
    buyAsset?: string;
    /** Fiat code the user pays with. */
    fiat?: string;
    paymentMethod?: string;
    provider?: string;
}

export interface WithdrawRampContext {
    from: RampSource;
    /** Backend asset id of the crypto being sold. */
    sellAsset: string;
    /** Fiat code the user is paid out in. */
    fiat?: string;
    paymentMethod?: string;
    provider?: string;
}

const asset = (id: string | undefined) => (id ? normalizeAnalyticsAssetId(id) : '');

const quoteAmount = (quote: RampQuote) => {
    const n = Number(quote.amountIn);
    return Number.isFinite(n) ? n : 0;
};

const depositBase = (ctx: DepositRampContext) => ({
    from: ctx.from,
    add_funds_option: 'buy_with_fiat' as const,
    buy_asset: asset(ctx.buyAsset),
    sell_asset: ctx.fiat ?? ''
});

const depositFields = (ctx: DepositRampContext) => ({
    ...depositBase(ctx),
    payment_method: ctx.paymentMethod ?? '',
    provider_name: ctx.provider ?? ''
});

const withdrawBase = (ctx: WithdrawRampContext) => ({
    from: ctx.from,
    withdraw_option: 'sell_to_card' as const,
    sell_asset: asset(ctx.sellAsset),
    buy_asset: ctx.fiat ?? ''
});

const withdrawFields = (ctx: WithdrawRampContext) => ({
    ...withdrawBase(ctx),
    payment_method: ctx.paymentMethod ?? '',
    provider_name: ctx.provider ?? ''
});

/** Add Funds funnel, mirroring the native `deposit_*` flow events. */
export const useDepositFlowAnalytics = () => {
    const track = useAnalyticsTrack();
    const walletMode = useActiveAccount().type === 'multichain' ? 'multi' : 'single';
    return useMemo(
        () => ({
            started: (from: RampSource, availableOptions: AddFundsOption[]) =>
                track({
                    eventName: 'deposit_started',
                    from,
                    wallet_mode: walletMode,
                    available_options: availableOptions
                }),
            optionClick: (from: RampSource, option: AddFundsOption) =>
                track({
                    eventName: 'deposit_option_click',
                    from,
                    wallet_mode: walletMode,
                    add_funds_option: option
                }),
            viewFiatChooseAsset: (from: RampSource, assetIds: string[]) =>
                track({
                    eventName: 'deposit_view_fiat_choose_asset',
                    from,
                    add_funds_option: 'buy_with_fiat',
                    available_options: assetIds.map(asset)
                }),
            clickFiatAsset: (from: RampSource, buyAsset: string) =>
                track({
                    eventName: 'deposit_click_fiat_asset',
                    from,
                    add_funds_option: 'buy_with_fiat',
                    buy_asset: asset(buyAsset)
                }),
            viewFiatPaymentMethod: (ctx: DepositRampContext, methods: string[]) =>
                track({
                    eventName: 'deposit_view_fiat_payment_method',
                    ...depositBase(ctx),
                    available_options: methods
                }),
            clickFiatPaymentMethod: (ctx: DepositRampContext) =>
                track({
                    eventName: 'deposit_click_fiat_payment_method',
                    ...depositBase(ctx),
                    payment_method: ctx.paymentMethod ?? ''
                }),
            continueToP2pMarket: (from: RampSource) =>
                track({
                    eventName: 'deposit_continue_to_p2p_market',
                    from,
                    wallet_mode: walletMode,
                    add_funds_option: 'buy_with_p2p_market'
                }),
            viewRampInsertAmount: (ctx: DepositRampContext) =>
                track({ eventName: 'deposit_view_ramp_insert_amount', ...depositFields(ctx) }),
            clickRampInsertAmountContinue: (ctx: DepositRampContext, quote: RampQuote) =>
                track({
                    eventName: 'deposit_click_ramp_insert_amount_continue',
                    ...depositFields(ctx),
                    amount: quoteAmount(quote)
                }),
            continueToRampProvider: (ctx: DepositRampContext, quote: RampQuote) =>
                track({
                    eventName: 'deposit_continue_to_ramp_provider',
                    ...depositFields(ctx),
                    wallet_mode: walletMode,
                    amount: quoteAmount(quote),
                    tx_id: quote.merchantTransactionId
                })
        }),
        [track, walletMode]
    );
};

/** Sell-to-cash funnel, mirroring the native `withdraw_*` flow events. */
export const useWithdrawFlowAnalytics = () => {
    const track = useAnalyticsTrack();
    return useMemo(
        () => ({
            started: (from: RampSource) =>
                track({
                    eventName: 'withdraw_started',
                    from,
                    available_options: ['sell_to_card']
                }),
            optionClick: (from: RampSource) =>
                track({
                    eventName: 'withdraw_option_click',
                    from,
                    withdraw_option: 'sell_to_card'
                }),
            viewFiatPaymentMethod: (ctx: WithdrawRampContext, methods: string[]) =>
                track({
                    eventName: 'withdraw_view_fiat_payment_method',
                    ...withdrawBase(ctx),
                    available_options: methods
                }),
            clickFiatPaymentMethod: (ctx: WithdrawRampContext) =>
                track({
                    eventName: 'withdraw_click_fiat_payment_method',
                    ...withdrawBase(ctx),
                    payment_method: ctx.paymentMethod ?? ''
                }),
            viewRampInsertAmount: (ctx: WithdrawRampContext) =>
                track({ eventName: 'withdraw_view_ramp_insert_amount', ...withdrawFields(ctx) }),
            clickRampInsertAmountContinue: (ctx: WithdrawRampContext, quote: RampQuote) =>
                track({
                    eventName: 'withdraw_click_ramp_insert_amount_continue',
                    ...withdrawFields(ctx),
                    amount: quoteAmount(quote)
                }),
            continueToRampProvider: (ctx: WithdrawRampContext, quote: RampQuote) =>
                track({
                    eventName: 'withdraw_continue_to_ramp_provider',
                    ...withdrawFields(ctx),
                    amount: quoteAmount(quote),
                    tx_id: quote.merchantTransactionId
                })
        }),
        [track]
    );
};
