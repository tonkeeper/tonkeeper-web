/**
 * chain-kit returns `Res<T, E>` for fallible operations: a Kotlin/JS
 * union with `value`, `error`, `isOk`, `isErr`. The `.unwrap()` method
 * throws the error when `isErr`. We keep our own `unwrap()` for two
 * reasons:
 *
 *  1. The compiled bundle's `unwrap()` throws the raw Kotlin error
 *     wrapper; we re-raise a regular `Error` so callers don't have to
 *     reach into Kotlin internals to read the message.
 *  2. Centralising the translation gives us a single point to add
 *     telemetry / breadcrumbs if a particular Res starts failing in
 *     production.
 */

export interface ChainKitRes<T, E> {
    readonly value: T | null | undefined;
    readonly error: E | null | undefined;
    readonly isOk: boolean;
    readonly isErr: boolean;
}

export const unwrap = <T, E>(res: ChainKitRes<T, E>): T => {
    if (res.isOk && res.value !== null && res.value !== undefined) {
        return res.value;
    }
    const err = res.error;
    if (err instanceof Error) throw err;
    throw new Error(typeof err === 'string' ? err : 'chain-kit Res was Err with no message');
};
