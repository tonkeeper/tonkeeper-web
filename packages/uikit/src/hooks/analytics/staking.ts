import { useEffect, useMemo, useRef } from 'react';
import { Address } from '@ton/core';
import BigNumber from 'bignumber.js';
import { PoolInfo } from '@tonkeeper/core/dist/tonApiV2';

import { useStakingPoolImplementations } from '../../state/staking/useStakingPools';
import { useAnalyticsTrack } from './index';
import { RedMetadata, toRedError, toRedOutcome, useRedOperation } from './red-operation';

/**
 * Screen the stake / unstake form was reached from, in the native apps'
 * vocabulary: `wallet` — the wallet screen's action; `staking_viewer` — a
 * pool's position page; `deeplink` — a staking link.
 */
export type StakingSource = 'wallet' | 'staking_viewer' | 'deeplink';

/** `claim` collects a matured withdrawal: an unstake for RED, outside the minus funnel. */
export type StakingOperation = 'stake' | 'unstake' | 'claim';

export type StakingAnalyticsProps = {
    jetton_symbol: string;
    provider_name: string;
    provider_domain: string;
};

/** The native apps report the staked coin by their TON token's symbol. */
const STAKING_JETTON_SYMBOL = 'GRAM';

const CONFIRM_STAGE = 'confirm';
const SEND_STAGE = 'send';

let pendingOpenSource: StakingSource = 'wallet';

/**
 * Names the source of the next legacy staking-section visit. Entry points that
 * aren't the wallet's own staking button call this right before navigating.
 */
export const setStakingOpenSource = (from: StakingSource) => {
    pendingOpenSource = from;
};

export const consumeStakingOpenSource = (): StakingSource => {
    const from = pendingOpenSource;
    pendingOpenSource = 'wallet';
    return from;
};

/**
 * `provider_name` is the pool implementation id (`whales`, `tf`, `liquidTF`)
 * and `provider_domain` its site url, as the native apps send them. Undefined
 * until both the pool and the implementations list have loaded.
 */
export const useStakingAnalyticsProps = (
    pool: PoolInfo | undefined
): StakingAnalyticsProps | undefined => {
    const { data: implementations } = useStakingPoolImplementations();

    return useMemo(() => {
        if (!pool || !implementations) return undefined;
        return {
            jetton_symbol: STAKING_JETTON_SYMBOL,
            provider_name: pool.implementation,
            provider_domain: implementations[pool.implementation]?.url ?? ''
        };
    }, [pool, implementations]);
};

/**
 * `staking_open` (stake only) the moment the form opens, then the matching
 * `*_input` once the pool's props resolve — each once per opening.
 */
export const useTrackStakingFormOpen = ({
    isOpen,
    operation,
    from,
    props
}: {
    isOpen: boolean;
    operation: 'stake' | 'unstake';
    from: StakingSource;
    props: StakingAnalyticsProps | undefined;
}) => {
    const track = useAnalyticsTrack();
    const wasOpen = useRef(false);
    const inputPending = useRef(false);

    useEffect(() => {
        const justOpened = isOpen && !wasOpen.current;
        wasOpen.current = isOpen;
        if (!justOpened) return;
        inputPending.current = true;
        if (operation === 'stake') {
            track({ eventName: 'staking_open', from });
        }
    }, [isOpen, operation, from, track]);

    useEffect(() => {
        if (!isOpen || !props || !inputPending.current) return;
        inputPending.current = false;
        if (operation === 'stake') {
            track({ eventName: 'staking_plus_input', from, ...props });
        } else {
            track({ eventName: 'staking_minus_input', from, ...props });
        }
    }, [isOpen, props, operation, from, track]);
};

/** Tracks the amount step's Continue tap; skipped while the props are still loading. */
export const useTrackStakingConfirm = (
    operation: 'stake' | 'unstake',
    props: StakingAnalyticsProps | undefined
) => {
    const track = useAnalyticsTrack();

    return () => {
        if (!props) return;
        if (operation === 'stake') {
            track({ eventName: 'staking_plus_confirm', ...props });
        } else {
            track({ eventName: 'staking_minus_confirm', ...props });
        }
    };
};

const rawAddress = (address: string): string => {
    try {
        return Address.parse(address).toRawString();
    } catch {
        return address;
    }
};

const redMetadata = (pool: PoolInfo, amount: BigNumber): RedMetadata => ({
    amount: amount.toNumber(),
    pool_address: rawAddress(pool.address),
    pool_kind: pool.implementation
});

/**
 * RED operation for signing and broadcasting a staking transaction, opened by
 * the confirm tap. A successful stake / unstake also emits its `*_success`.
 */
export const useStakingSendOperation = (
    pool: PoolInfo | undefined,
    operation: StakingOperation
) => {
    const red = useRedOperation();
    const track = useAnalyticsTrack();
    const props = useStakingAnalyticsProps(pool);

    return useMemo(
        () => ({
            start: (amount: BigNumber) => {
                if (!pool) return;
                red.start({
                    flow: 'stake',
                    operation: operation === 'stake' ? 'stake' : 'unstake',
                    attemptSource: 'native_ui',
                    metadata: redMetadata(pool, amount)
                });
            },
            succeed: () => {
                red.finish('success', { stage: 'send' });
                if (!props) return;
                if (operation === 'stake') {
                    track({ eventName: 'staking_plus_success', ...props });
                } else if (operation === 'unstake') {
                    track({ eventName: 'staking_minus_success', ...props });
                }
            },
            fail: (error: unknown) => {
                const outcome = toRedOutcome(error);
                red.finish(outcome, {
                    error: toRedError(error, 'transaction_send_failed'),
                    stage: outcome === 'cancel' ? CONFIRM_STAGE : SEND_STAGE
                });
            }
        }),
        [red, track, props, pool, operation]
    );
};
