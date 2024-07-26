/* eslint-disable react-hooks/rules-of-hooks */
import { atom, useAtom } from '../../libs/atom';
import { useCallback } from 'react';

export const createModalControl = <T extends object = object>() => {
    const control = atom<T | undefined>(undefined);

    return {
        hook: () => {
            const [isOpen, setOpenParams] = useAtom(control);

            return {
                isOpen,
                onOpen: useCallback((params: T = {} as T) => setOpenParams(params), []),
                onClose: useCallback(() => setOpenParams(undefined), [])
            };
        },
        control
    };
};
