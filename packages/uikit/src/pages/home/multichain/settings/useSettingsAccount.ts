import { Account } from '@tonkeeper/core/dist/entries/account';

import { useSearchParams } from '../../../../hooks/router/useSearchParams';
import { useAccountState, useActiveAccount } from '../../../../state/wallet';

export const SETTINGS_ACCOUNT_ID_PARAM = 'accountId';

/**
 * Account a settings screen operates on: the active account by default,
 * or any other account when deep-linked with `?accountId=` (the
 * manage-wallets per-row edit). An unknown id falls back to the active
 * account rather than rendering a dead screen.
 */
export const useSettingsAccount = (): Account => {
    const [searchParams] = useSearchParams();
    const requestedId = searchParams.get(SETTINGS_ACCOUNT_ID_PARAM) ?? undefined;
    const requested = useAccountState(requestedId);
    const active = useActiveAccount();
    return requested ?? active;
};
