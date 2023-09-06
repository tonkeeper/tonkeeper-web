export type IEventEmitter<T> = {
    on<Key extends string & keyof T>(
        method: `${Key}`,
        callback: (options: { method: `${Key}`; id?: number; params: T[Key] }) => void
    ): void;
    off<Key extends string & keyof T>(
        eventName: `${Key}`,
        callback: (options: { method: `${Key}`; id?: number; params: T[Key] }) => void
    ): void;
    emit<Key extends string & keyof T>(
        eventName: `${Key}`,
        params?: { method: `${Key}`; id?: number; params: T[Key] }
    ): void;
};

/*eslint-disable @typescript-eslint/no-explicit-any*/
export class EventEmitter {
    callbacks: { [s: string]: ((...args: any[]) => void)[] } = {};

    on(event: string, cb: (...args: any[]) => void) {
        if (!this.callbacks[event]) this.callbacks[event] = [];
        this.callbacks[event].push(cb);
    }

    off(event: string, cb: (...args: any[]) => void) {
        const cbs = this.callbacks[event];
        if (cbs) {
            this.callbacks[event] = cbs.filter(item => item !== cb);
        }
    }

    emit(event: string, data: any) {
        const cbs = this.callbacks[event];
        if (cbs) {
            cbs.forEach(cb => cb(data));
        }
    }
}
