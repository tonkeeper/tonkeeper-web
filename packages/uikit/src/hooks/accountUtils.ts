import { Account } from '@tonkeeper/core/dist/entries/account';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { useActiveTonNetwork } from '../state/wallet';
import { useTranslation } from './translation';

export function useAccountLabel(account: Account) {
    const tonWallets = account.allTonWallets;
    const network = useActiveTonNetwork();
    const { t } = useTranslation();

    return tonWallets.length === 1
        ? toShortValue(formatAddress(tonWallets[0].rawAddress, network))
        : tonWallets.length + ' ' + t('wallets');
}
