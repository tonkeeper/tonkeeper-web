import { useCheckMultisigsSigners } from './multisig';

export const useGlobalSetup = () => {
    useCheckMultisigsSigners();
};
