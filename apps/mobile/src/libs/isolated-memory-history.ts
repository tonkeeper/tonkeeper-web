export type Listener = (location: {
    pathname: string;
    search: string;
    hash: string;
    state: unknown;
}) => void;

export type Action = 'PUSH' | 'REPLACE' | 'POP';

export type LocationEntry = {
    pathname: string;
    search: string;
    hash: string;
    state: unknown;
};

export type MemoryHistory = {
    location: LocationEntry;
    index: number;
    length: number;
    entries: LocationEntry[];
    action: Action;
    push: (path: string, state?: unknown) => void;
    replace: (path: string, state?: unknown) => void;
    go: (n: number) => void;
    goBack: () => void;
    back: () => void;
    goForward: () => void;
    canGo: (n: number) => boolean;
    listen: (listener: Listener) => () => void;
    block: (prompt: string | ((location: LocationEntry) => string | boolean)) => () => void;
    createHref: (location: LocationEntry) => string;
};

export function createIsolatedMemoryHistory(
    initialEntries: LocationEntry[] = [{ pathname: '/', search: '', hash: '', state: null }],
    initialIndex = 0
): MemoryHistory {
    let listeners: Listener[] = [];
    let entries: LocationEntry[] = [...initialEntries];
    let index: number = initialIndex;
    let action: Action = 'POP';
    let blockPrompt: null | ((location: LocationEntry) => string | boolean) = null;

    const notifyListeners = (location: LocationEntry) => {
        if (blockPrompt) {
            const result = blockPrompt(location);
            if (typeof result === 'string') {
                if (!window.confirm(result)) return;
            } else if (!result) {
                return;
            }
        }
        listeners.forEach(listener => listener(location));
    };

    const history: MemoryHistory = {
        get location() {
            return entries[index];
        },
        get index() {
            return index;
        },
        get length() {
            return entries.length;
        },
        get entries() {
            return [...entries];
        },
        get action() {
            return action;
        },
        push(path: string, state: unknown = null) {
            const [pathname, search = '', hash = ''] = path.split(/[?#]/);
            entries = [...entries.slice(0, index + 1), { pathname, search, hash, state }];
            index++;
            action = 'PUSH';
            notifyListeners(history.location);
        },
        replace(path: string, state: unknown = null) {
            const [pathname, search = '', hash = ''] = path.split(/[?#]/);
            entries[index] = { pathname, search, hash, state };
            action = 'REPLACE';
            notifyListeners(history.location);
        },
        go(n: number) {
            const newIndex = Math.max(0, Math.min(index + n, entries.length - 1));
            if (newIndex !== index) {
                index = newIndex;
                action = 'POP';
                notifyListeners(history.location);
            }
        },
        goBack() {
            history.go(-1);
        },
        back() {
            history.go(-1);
        },
        goForward() {
            history.go(1);
        },
        canGo(n: number) {
            const newIndex = index + n;
            return newIndex >= 0 && newIndex < entries.length;
        },
        listen(listener: Listener) {
            listeners.push(listener);
            return () => {
                listeners = listeners.filter(l => l !== listener);
            };
        },
        block(prompt) {
            blockPrompt = typeof prompt === 'function' ? prompt : () => prompt;
            return () => {
                blockPrompt = null;
            };
        },
        createHref(location) {
            return (
                location.pathname +
                (location.search ? `?${location.search}` : '') +
                (location.hash ? `#${location.hash}` : '')
            );
        }
    };

    return history;
}
