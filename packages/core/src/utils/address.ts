import { Address } from '@ton/core';
import { decodeBase58, sha256 } from 'ethers';
import { Network } from '../entries/network';
import { CryptoCurrency } from '../entries/crypto';

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

export const isTonCoinAddress = (address: string) => {
    return address.toLowerCase() === CryptoCurrency.TON.toLowerCase();
};

export const formatAddress = (value: string | Address, network?: Network, bounceable = false) => {
    return (typeof value === 'string' ? Address.parse(value) : value).toString({
        testOnly: network === Network.TESTNET,
        bounceable
    });
};

export const isTonAddress = (value: string): boolean => {
    try {
        if (value.includes('://')) {
            return false; // ignore links
        }
        Address.parse(value);
        return true;
    } catch (e) {
        return false;
    }
};

export const isTronAddress = (address: string): boolean => {
    try {
        const decoded = decodeBase58(address).toString(16);
        if (decoded.length !== 50 || !decoded.startsWith('41')) {
            return false;
        }
        const payload = decoded.slice(0, 42);
        const tail = decoded.slice(42);
        const checkSumTail = sha256(sha256('0x' + payload)).slice(2, 10);
        return tail === checkSumTail;
    } catch (e) {
        return false;
    }
};
