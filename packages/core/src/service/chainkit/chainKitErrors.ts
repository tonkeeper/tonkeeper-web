import { loadedChainkit } from '../../chains/chainkitLoader';

export type ChainKitFailure = { kind: 'insufficientFunds' } | { kind: 'rejected'; message: string };

/**
 * The chain-kit failures that carry a reason worth telling the user, as the
 * Android confirm screen reads them: a balance the chain found short, and a
 * node that rejected the transaction with its own message. `undefined` for
 * every other error, including errors that didn't come from chain-kit.
 */
export const chainKitFailureOf = (error: unknown): ChainKitFailure | undefined => {
    const kit = loadedChainkit();
    if (!kit) return undefined;

    // Fee, signing and broadcast paths wrap node failures in their own
    // `Unknown`; the bound guards against a cause chain that loops.
    let current: unknown = error;
    for (let depth = 0; depth < 8 && current instanceof Error; depth++) {
        if (
            current instanceof kit.NodeError.InsufficientFunds ||
            current instanceof kit.ChainError.InsufficientFunds ||
            current instanceof kit.ChainError.BitcoinInsufficientInputs ||
            current instanceof kit.SignError.InsufficientInputs
        ) {
            return { kind: 'insufficientFunds' };
        }
        if (current instanceof kit.NodeError.Rejected) {
            const message = current.message?.trim();
            return message ? { kind: 'rejected', message } : undefined;
        }
        if (current instanceof kit.NodeError.Unknown) {
            current = current.error;
        } else if (
            current instanceof kit.ChainError.Unknown ||
            current instanceof kit.SignError.Unknown ||
            current instanceof kit.TxError.Unknown
        ) {
            current = (current as { cause?: unknown }).cause;
        } else {
            return undefined;
        }
    }
    return undefined;
};

export const isChainKitInsufficientFunds = (error: unknown): boolean =>
    chainKitFailureOf(error)?.kind === 'insufficientFunds';
