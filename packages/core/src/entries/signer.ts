/**
 * Compatibility re-export. The signer type union now lives in
 * `service/sign/types.ts` alongside the factory/registry that produces it.
 * Existing callers that import from `@tonkeeper/core/dist/entries/signer`
 * keep working unchanged.
 */
export type {
    BaseSigner,
    CellSigner,
    ChainSigner,
    LedgerSigner,
    MultiTransactionsSigner,
    Signer,
    SignerFactory,
    SignerFactoryArgs,
    TronSigner
} from '../service/sign/types';
