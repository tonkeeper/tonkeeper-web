import { useCheckMultisigsSigners } from './multisig';
import { useBatteryServiceConfigQuery } from './battery';

export const useGlobalSetup = () => {
    useCheckMultisigsSigners();
    const { isLoading } = useBatteryServiceConfigQuery();

    return { isLoading };
};
