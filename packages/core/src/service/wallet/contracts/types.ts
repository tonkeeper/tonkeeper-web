import { ChainId } from '../../../chains/types';

/**
 * Strategy that produces a chain-specific "wallet contract" handle from
 * a chain-specific args bag. Only TON is wired up today; the parameters
 * are left fully generic so non-TON chains can return whatever shape
 * they need (EVM contract instance, BTC PSBT factory, etc.) without
 * forcing a lowest-common-denominator interface here.
 *
 * A nominal `WalletContractLike` minimum surface (`address`, `init`,
 * `createTransfer`, `createRequest` for V5) is left implicit because
 * today's call sites depend on the concrete `WalletContractVxxx` union
 * — gasless / battery / two-fa senders downcast to
 * `WalletContractV5R1`, `externalMessage()` consumes the union directly
 * — so narrowing the return to a structural interface would break those
 * casts.
 */
export interface WalletContractStrategy<TArgs = unknown, TContract = unknown> {
    readonly chain: ChainId;
    create(args: TArgs): TContract;
}
