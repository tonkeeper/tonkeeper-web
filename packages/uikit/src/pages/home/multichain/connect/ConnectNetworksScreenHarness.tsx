import { FC } from 'react';

import { AccountMultichain } from '@tonkeeper/core/dist/entries/account';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';

import { ConnectNetworksScreen } from './ConnectNetworksScreen';

/**
 * CT mount wrapper: `AccountMultichain` is a class instance and doesn't
 * survive the Node→browser prop serialization, so the account is built
 * in-browser from plain string props.
 */
export const ConnectNetworksScreenHarness: FC<{
    evmAddress: string;
    tronAddress: string;
    networks: string[];
}> = ({ evmAddress, tronAddress, networks }) => {
    const account = new AccountMultichain(
        'ct-account',
        'CT Wallet',
        '🧪',
        { kind: 'password', encryptedSecret: '' },
        ['ton', 'evm', 'tron'],
        { ton: 'ton-w', evm: 'evm-w', tron: 'tron-w' },
        [
            {
                id: 'ton-w',
                rawAddress: '0:' + '0'.repeat(64),
                publicKey: '0'.repeat(64),
                version: WalletVersion.V5R1
            },
            {
                id: 'evm-w',
                chain: 'evm',
                rawAddress: evmAddress,
                publicKey: '04'.repeat(33),
                derivationPath: "m/44'/60'/0'/0/0"
            },
            {
                id: 'tron-w',
                chain: 'tron',
                rawAddress: tronAddress,
                publicKey: '02'.repeat(33),
                derivationPath: "m/44'/195'/0'/0/0"
            }
        ]
    );

    return <ConnectNetworksScreen account={account} networks={networks} onDone={() => {}} />;
};
