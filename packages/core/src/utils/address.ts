import { Address } from '@ton/core';

export function eqAddresses(address1: string, address2?: string) {
    try {
        if (!address2) {
            return false;
        }
        return Address.parse(address1).equals(Address.parse(address2));
    } catch (e) {
        return false;
    }
}
