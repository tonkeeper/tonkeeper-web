/* eslint-disable react-hooks/rules-of-hooks */
import { atom, useAtom } from '../../libs/atom';
import { useCallback } from 'react';

export const createModalControl = <T extends object = object>() => {
    const paramsControl = atom<T | undefined>(undefined);
    const isOpenControl = atom(false);

    return {
        hook: () => {
            const [_, setParams] = useAtom(paramsControl);
            const [isOpen, setIsOpen] = useAtom(isOpenControl);

            return {
                isOpen,
                onOpen: useCallback(
                    (p: T = {} as T) => {
                        setParams(p);
                        setIsOpen(true);
                    },
                    [setParams, setParams]
                ),
                onClose: useCallback(() => setIsOpen(false), [setIsOpen])
            };
        },
        paramsControl
    };
};
