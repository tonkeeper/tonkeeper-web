// Blocker states
interface BlockerBlocked {
    state: 'blocked';
    reset(): void;
    proceed(): void;
}

interface BlockerUnblocked {
    state: 'unblocked';
    reset: undefined;
    proceed: undefined;
    location: undefined;
}

interface BlockerProceeding {
    state: 'proceeding';
    reset: undefined;
    proceed: undefined;
    location: Location;
}

export type Blocker = BlockerUnblocked | BlockerBlocked | BlockerProceeding;

type BlockerFunction = (location: Location) => boolean;

interface UseBlockerResult {
    blocker: Blocker;
    block: (shouldBlock: boolean | BlockerFunction) => void;
    unblock: () => void;
}

export const useBlocker = (shouldBlock: boolean | BlockerFunction) => {
    // TODO implement
    return {
        state: 'unblocked' as 'blocked' | 'unblocked' | 'proceeding',
        reset: () => {},
        proceed: () => {},
        location: undefined
    } as const;
};
