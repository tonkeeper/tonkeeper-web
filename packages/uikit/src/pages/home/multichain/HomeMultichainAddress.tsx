import { FC, useState } from 'react';

import { useAppSdk } from '../../../hooks/appSdk';
import { useLongPress } from '../../../hooks/useLongPress';
import { useTranslation } from '../../../hooks/translation';
import { useActiveAccount } from '../../../state/wallet';
import { MultichainReceiveSheet } from '../../../components/receive/MultichainReceiveSheet';
import { RECEIVE_CHAINS } from '../../../components/receive/receiveChains';
import { AccountAddressLabel, accountAddress, accountShortAddress } from './wallets/accountDisplay';

/**
 * The wallet's TON address under the home total. A tap opens the same
 * receiving-address sheet as Add Funds → Receive, so every per-network
 * address is one tap from the home screen; a long press copies the TON
 * address in place. The copy goes through the sdk, which also fires the
 * success haptic on platforms that have one.
 */
export const HomeMultichainAddress: FC = () => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const account = useActiveAccount();
    const [receiveOpen, setReceiveOpen] = useState(false);

    const copyAddress = () => {
        const chain = RECEIVE_CHAINS.find(c => c.chainId === 'ton');
        sdk.copyToClipboard(
            accountAddress(account),
            t('receive_address_copied', {
                chain: chain?.displayName ?? 'TON',
                address: accountShortAddress(account)
            })
        );
    };

    const press = useLongPress({
        onClick: () => setReceiveOpen(true),
        onLongPress: copyAddress
    });

    return (
        <>
            <button
                type="button"
                {...press}
                className="flex select-none items-center pb-2 pt-1 [-webkit-touch-callout:none]"
            >
                <AccountAddressLabel
                    account={account}
                    className="transition-colors duration-100 hover:text-textPrimary"
                />
            </button>
            <MultichainReceiveSheet isOpen={receiveOpen} onClose={() => setReceiveOpen(false)} />
        </>
    );
};
