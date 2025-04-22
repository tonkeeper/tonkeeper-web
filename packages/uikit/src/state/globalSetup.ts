import { useCheckMultisigsSigners } from './multisig';
import { useBatteryServiceConfigQuery } from './battery';
import { useGaslessConfigQuery } from './gasless';
import { useAtomValue } from '../libs/useAtom';
import { useAppSdk } from '../hooks/appSdk';
import { atom } from '@tonkeeper/core/dist/entries/atom';
import { KeychainSecurity } from '@tonkeeper/core/dist/AppSdk';

const emptyAtom = atom<KeychainSecurity>({});

export const useGlobalSetup = () => {
    useCheckMultisigsSigners();
    const { isLoading: isBatteryServiceConfigLoading } = useBatteryServiceConfigQuery();
    const { isLoading: isGaslessConfigLoading } = useGaslessConfigQuery();
    const sdk = useAppSdk();
    const keychain = useAtomValue(sdk.keychain?.security ?? emptyAtom);

    return { isLoading: isGaslessConfigLoading || isBatteryServiceConfigLoading || !keychain };
};
