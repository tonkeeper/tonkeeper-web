import { Address } from '@ton/core';

export function eqAddresses(address1: string | Address, address2?: string | Address) {
    if (address1 && address1 === address2) {
        return true;
    }

    try {
        if (!address2) {
            return false;
        }

        if (typeof address1 === 'string') {
            address1 = Address.parse(address1);
        }

        if (typeof address2 === 'string') {
            address2 = Address.parse(address2);
        }

        return address1.equals(address2);
    } catch (e) {
        return false;
    }
}
