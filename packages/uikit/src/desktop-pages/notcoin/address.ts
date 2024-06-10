import { Address } from '@ton/core';

function findMatchingBits(a: number, b: number, start_from: number) {
    let bitPos = start_from;
    let keepGoing = true;
    do {
        const bitCount = bitPos + 1;
        const mask = (1 << bitCount) - 1;
        const shift = 8 - bitCount;
        if (((a >> shift) & mask) == ((b >> shift) & mask)) {
            bitPos++;
        } else {
            keepGoing = false;
        }
    } while (keepGoing && bitPos < 7);

    return bitPos;
}

export function chooseAddress(user: Address, contracts: Address[]) {
    const maxBytes = 32;
    let byteIdx = 0;
    let bitIdx = 0;
    let bestMatch: Address | undefined;

    if (user.workChain !== 0) {
        throw new TypeError(`Only basechain user address allowed:${user}`);
    }
    for (let testContract of contracts) {
        if (testContract.workChain !== 0) {
            throw new TypeError(`Only basechain deposit address allowed:${testContract}`);
        }
        if (byteIdx >= maxBytes) {
            break;
        }
        if (
            byteIdx == 0 ||
            testContract.hash.subarray(0, byteIdx).equals(user.hash.subarray(0, byteIdx))
        ) {
            let keepGoing = true;
            do {
                if (keepGoing && testContract.hash[byteIdx] == user.hash[byteIdx]) {
                    bestMatch = testContract;
                    byteIdx++;
                    bitIdx = 0;
                    if (byteIdx == maxBytes) {
                        break;
                    }
                } else {
                    keepGoing = false;
                    if (bitIdx < 7) {
                        const resIdx = findMatchingBits(
                            user.hash[byteIdx],
                            testContract.hash[byteIdx],
                            bitIdx
                        );
                        if (resIdx > bitIdx) {
                            bitIdx = resIdx;
                            bestMatch = testContract;
                        }
                    }
                }
            } while (keepGoing);
        }
    }
    return {
        match: bestMatch,
        prefixLength: byteIdx * 8 + bitIdx
    };
}
