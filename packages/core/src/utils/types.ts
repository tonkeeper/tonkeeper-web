export type Flatten<T> = T extends (infer R)[] ? R : T;

export function assertUnreachable(_: never): never {
    throw new Error("Didn't expect to get here");
}

export type NonNullableFields<T> = {
    [P in keyof T]: NonNullable<T[P]>;
};
