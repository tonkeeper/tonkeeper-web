/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it, vi } from 'vitest';
import { ReplaySubject, atom, replaySubject, subject } from '../atom';

describe('Atom', () => {
    it('stores the current value', () => {
        const a = atom<number>(42);
        expect(a.value).toBe(42);

        a.next(7);
        expect(a.value).toBe(7);
    });

    it('notifies subscribers of new values', () => {
        const a = atom<number>(0);
        const cb = vi.fn();
        a.subscribe(cb);

        a.next(1);

        expect(cb.mock.calls[0][0]).toBe(1);
    });

    it('does NOT synchronously emit the initial value on subscribe', () => {
        const a = atom<number>(5);
        const cb = vi.fn();
        a.subscribe(cb);

        expect(cb).not.toHaveBeenCalled();
    });
});


describe('Subject', () => {
    it('delivers values to current subscribers', () => {
        const s = subject<number>();
        const cb = vi.fn();
        s.subscribe(cb);

        s.next(1);
        s.next(2);

        expect(cb).toHaveBeenCalledTimes(2);
        expect(cb.mock.calls[0][0]).toBe(1);
        expect(cb.mock.calls[1][0]).toBe(2);
    });

    it('does NOT replay past values to late subscribers', () => {
        const s = subject<number>();
        s.next(1);
        s.next(2);

        const cb = vi.fn();
        s.subscribe(cb);

        expect(cb).not.toHaveBeenCalled();
    });

    it('unsubscribes via returned disposer', () => {
        const s = subject<number>();
        const cb = vi.fn();
        const unsubscribe = s.subscribe(cb);

        s.next(1);
        unsubscribe();
        s.next(2);

        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb.mock.calls[0][0]).toBe(1);
    });
});

describe('ReplaySubject', () => {
    it('replays the single most recent value to a late subscriber by default', () => {
        const rs = replaySubject<number>();
        rs.next(1);
        rs.next(2);

        const cb = vi.fn();
        rs.subscribe(cb);

        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb.mock.calls[0][0]).toBe(2);
    });

    it('replays every buffered value when bufferSize is "all"', () => {
        const rs = replaySubject<number>('all');
        rs.next(1);
        rs.next(2);
        rs.next(3);

        const cb = vi.fn();
        rs.subscribe(cb);

        expect(cb).toHaveBeenCalledTimes(3);
        expect(cb.mock.calls.map(c => c[0])).toEqual([1, 2, 3]);
    });

    it('respects an explicit numeric buffer size', () => {
        const rs = replaySubject<number>(2);
        rs.next(1);
        rs.next(2);
        rs.next(3);

        const cb = vi.fn();
        rs.subscribe(cb);

        expect(cb).toHaveBeenCalledTimes(2);
        expect(cb.mock.calls.map(c => c[0])).toEqual([2, 3]);
    });

    it('continues delivering new values after the initial replay', () => {
        const rs = replaySubject<number>('all');
        rs.next(1);

        const cb = vi.fn();
        rs.subscribe(cb);

        rs.next(2);
        rs.next(3);

        expect(cb).toHaveBeenCalledTimes(3);
        expect(cb.mock.calls.map(c => c[0])).toEqual([1, 2, 3]);
    });

    it('unsubscribes via returned disposer', () => {
        const rs = replaySubject<number>('all');
        const cb = vi.fn();
        const unsubscribe = rs.subscribe(cb);

        rs.next(1);
        unsubscribe();
        rs.next(2);

        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb.mock.calls[0][0]).toBe(1);
    });

    // Regression: Array.prototype.forEach passes (value, index, array) to its
    // callback. The previous implementation used `this.buffer.forEach(fn)`
    // directly, which silently leaked the index/array arguments to
    // subscribers. Subscribers must be invoked with exactly one argument
    // during replay, matching the contract of `next`.
    it('invokes the subscriber with exactly one argument during replay', () => {
        const rs = replaySubject<number>('all');
        rs.next(42);

        const cb = vi.fn();
        rs.subscribe(cb);

        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb.mock.calls[0]).toHaveLength(1);
        expect(cb.mock.calls[0][0]).toBe(42);
    });

    // This scenario mirrors the desktop deeplink-cold-start bug: the IPC
    // producer in the preload buffers values before the renderer has had a
    // chance to register its listener. A late subscriber must still receive
    // everything that arrived while they were not yet ready.
    it('simulates a producer-before-consumer cold start', () => {
        const ipcChannel = replaySubject<{ id: string }>('all');

        ipcChannel.next({ id: 'tx-1' });
        ipcChannel.next({ id: 'tx-2' });

        const consumer = vi.fn();
        ipcChannel.subscribe(consumer);

        expect(consumer).toHaveBeenCalledTimes(2);
        expect(consumer.mock.calls.map(c => c[0])).toEqual([{ id: 'tx-1' }, { id: 'tx-2' }]);
    });

    it('exposes the ReplaySubject class', () => {
        expect(new ReplaySubject<number>()).toBeInstanceOf(ReplaySubject);
    });
});