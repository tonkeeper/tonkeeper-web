import { useEffect } from 'react';

import { AnalyticsEvent } from '@tonkeeper/core/dist/analytics';
import {
    toWalletInterface,
    toWalletMode,
    toWalletSource
} from '@tonkeeper/core/dist/analytics/wallet-mapping';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';

import { useActiveAccountQuery } from '../../state/wallet';
import { useAppContext } from '../appContext';
import { useAppSdk } from '../appSdk';
import { useLock } from '../lock';
import { useAnalyticsTrack } from './index';

type WalletOpenEvent = Extract<AnalyticsEvent, { eventName: 'wallet_open' }>;

const toWalletOpenInterface = (account: Account): WalletOpenEvent['wallet_interface'] => {
    // `wallet_interface` names exactly one chain's account model, so a
    // multichain wallet has none to report. A watch-only account holds a bare
    // address whose contract revision is unknown.
    if (account.type === 'multichain' || account.type === 'watch-only') {
        return undefined;
    }

    const wallet = account.activeTonWallet;
    // A TON contract without a version is a multisig — a smart contract
    // account rather than one of the wallet revisions.
    return isStandardTonWallet(wallet) ? toWalletInterface(wallet.version) : 'smart_account';
};

/**
 * The latch is module-level, not a ref: a shell that swaps its root component
 * on a layout change (web crossing the desktop breakpoint, mobile switching
 * between the wide and narrow content) remounts the hook without the wallet
 * having changed. Re-firing would inflate opens for the same wallet.
 */
let reportedWalletId: string | undefined;

/**
 * Reports which wallet the user is looking at: once the app settles on an
 * unlocked wallet, and again on every switch to a different one.
 *
 * Mounted next to `useTrackLocation` in each shell root rather than on the main
 * screen itself — the event is about the active wallet, so it must not re-fire
 * every time the user navigates back to the main screen.
 */
export const useTrackWalletOpen = () => {
    const sdk = useAppSdk();
    const lock = useLock(sdk);
    const { tracker } = useAppContext();
    const track = useAnalyticsTrack();
    const { data: account } = useActiveAccountQuery();

    const walletId = account && `${account.id}/${account.activeTonWallet.id}`;

    useEffect(() => {
        // `track` no-ops until the tracker resolves — marking the wallet as
        // reported before then would swallow the event entirely.
        if (!tracker || lock !== false || !account || !walletId) return;
        if (reportedWalletId === walletId) return;
        reportedWalletId = walletId;

        const wallet_interface = toWalletOpenInterface(account);

        track({
            eventName: 'wallet_open',
            wallet_mode: toWalletMode(account),
            wallet_source: toWalletSource(account),
            ...(wallet_interface && { wallet_interface })
        });
    }, [tracker, lock, account, walletId, track]);
};
