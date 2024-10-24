import { useCheckMultisigsSigners } from './multisig';
import { useBatteryServiceConfigQuery } from './battery';
import { useGaslessConfigQuery } from './gasless';

export const useGlobalSetup = () => {
    useCheckMultisigsSigners();
    const { isLoading: isBatteryServiceConfigLoading } = useBatteryServiceConfigQuery();
    const { isLoading: isGaslessConfigLoading } = useGaslessConfigQuery();

    return { isLoading: isGaslessConfigLoading || isBatteryServiceConfigLoading };
};
