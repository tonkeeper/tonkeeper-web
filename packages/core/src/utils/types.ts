import { UsersService } from '../pro';

export type Flatten<T> = T extends (infer R)[] ? R : T;

export function assertUnreachable(_: never): never {
    throw new Error("Didn't expect to get here");
}

export function assertUnreachableSoft(_: never): void {
    console.error("Didn't expect to get here", _);
}

export type NonNullableFields<T> = {
    [P in keyof T]: NonNullable<T[P]>;
};

export function notNullish<T>(x: T | null | undefined): x is T {
    return x !== null && x !== undefined;
}

export type AllOrNone<T> = Required<T> | Partial<Record<keyof T, undefined>>;

/**
 * hex chars string with 0x prefix
 */
export type HexStringPrefixed = `0x${string}`;

export function errorMessage(e: unknown): string | undefined {
    if (typeof e === 'string') {
        return e;
    }

    if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
        return e.message;
    }

    return undefined;
}

export type OptionalProperty<T, K extends keyof T> = Omit<T, K> & {
    [P in K]?: T[P] | undefined;
};

type AssertEqual<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : never;

export function assertTypesEqual<A, B>(_value: AssertEqual<A, B>): void {
    //
}

export type UserInfo = Awaited<ReturnType<typeof UsersService.getUserInfo>>;

export type MultiTapOptions = {
    intervalMs?: number;
    requiredCount?: number;
    resetAfterTrigger?: boolean;
};
