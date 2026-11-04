/* eslint-disable import/no-extraneous-dependencies */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { chainKitFailureOf, isChainKitInsufficientFunds } from '../chainKitErrors';

class NodeInsufficientFunds extends Error {}
class NodeRejected extends Error {}
class NodeUnknown extends Error {
    constructor(readonly error?: Error) {
        super();
    }
}
class NodeNetworkWrap extends Error {}
class ChainInsufficientFunds extends Error {}
class ChainBitcoinInsufficientInputs extends Error {}
class WithCause extends Error {
    constructor(cause?: Error) {
        super('', { cause });
    }
}
class ChainUnknown extends WithCause {}
class SignInsufficientInputs extends Error {}
class SignUnknown extends WithCause {}
class TxUnknown extends WithCause {}

const fakeKit = {
    NodeError: {
        InsufficientFunds: NodeInsufficientFunds,
        Rejected: NodeRejected,
        Unknown: NodeUnknown,
        NetworkWrap: NodeNetworkWrap
    },
    ChainError: {
        InsufficientFunds: ChainInsufficientFunds,
        BitcoinInsufficientInputs: ChainBitcoinInsufficientInputs,
        Unknown: ChainUnknown
    },
    SignError: { InsufficientInputs: SignInsufficientInputs, Unknown: SignUnknown },
    TxError: { Unknown: TxUnknown }
};

const loader = vi.hoisted(() => ({ kit: null as unknown }));
vi.mock('../../../chains/chainkitLoader', () => ({ loadedChainkit: () => loader.kit }));

describe('chainKitFailureOf', () => {
    beforeEach(() => {
        loader.kit = fakeKit;
    });

    it.each([
        ['node', new NodeInsufficientFunds('insufficient funds for gas * price + value')],
        ['chain', new ChainInsufficientFunds('short')],
        ['bitcoin inputs', new ChainBitcoinInsufficientInputs('short')],
        ['sign inputs', new SignInsufficientInputs('short')]
    ])('reads a %s shortage as insufficient funds', (_, error) => {
        expect(chainKitFailureOf(error)).toEqual({ kind: 'insufficientFunds' });
        expect(isChainKitInsufficientFunds(error)).toBe(true);
    });

    it('unwraps shortages nested in Unknown wrappers', () => {
        const nested = new ChainUnknown(
            new SignUnknown(new TxUnknown(new NodeUnknown(new NodeInsufficientFunds('x'))))
        );
        expect(chainKitFailureOf(nested)).toEqual({ kind: 'insufficientFunds' });
    });

    it('passes a node rejection message through', () => {
        expect(chainKitFailureOf(new NodeUnknown(new NodeRejected('nonce too low')))).toEqual({
            kind: 'rejected',
            message: 'nonce too low'
        });
    });

    it('ignores a blank node rejection', () => {
        expect(chainKitFailureOf(new NodeRejected('  '))).toBeUndefined();
    });

    it('returns undefined for other chain-kit and foreign errors', () => {
        expect(chainKitFailureOf(new NodeNetworkWrap('offline'))).toBeUndefined();
        expect(chainKitFailureOf(new ChainUnknown())).toBeUndefined();
        expect(chainKitFailureOf(new Error('boom'))).toBeUndefined();
        expect(chainKitFailureOf('boom')).toBeUndefined();
        expect(chainKitFailureOf(null)).toBeUndefined();
    });

    it('returns undefined before chain-kit has loaded', () => {
        loader.kit = null;
        expect(chainKitFailureOf(new NodeInsufficientFunds('x'))).toBeUndefined();
    });
});
