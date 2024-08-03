export type Flatten<T> = T extends (infer R)[] ? R : T;

export function assertUnreachable(_: never): never {
    throw new Error("Didn't expect to get here");
}

export type NonNullableFields<T> = {
    [P in keyof T]: NonNullable<T[P]>;
};

export function notNullish<T>(x: T | null | undefined): x is T {
    return x !== null && x !== undefined;
}

export type AllOrNone<T> = Required<T> | Partial<Record<keyof T, undefined>>;
