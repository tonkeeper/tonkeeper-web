/* eslint-disable react-hooks/rules-of-hooks */
import { useAtom } from '../../libs/useAtom';
import { useCallback } from 'react';
import { atom } from '@tonkeeper/core/dist/entries/atom';

export const createModalControl = <T = object>() => {
    const paramsControl = atom<T | undefined>(undefined);
    const isOpenControl = atom(false);
    const controllerControl = atom(new AbortController());

    return {
        hook: () => {
            const [_, setParams] = useAtom(paramsControl);
            const [isOpen, setIsOpen] = useAtom(isOpenControl);
            const [controller, setController] = useAtom(controllerControl);

            return {
                isOpen,
                onOpen: useCallback(
                    (p: T = {} as T) => {
                        setParams(p);
                        setIsOpen(true);
                    },
                    [setParams, setIsOpen]
                ),
                onClose: useCallback(() => {
                    setIsOpen(false);
                    controller.abort('Modal Closed');
                    setTimeout(() => setController(new AbortController()), 2000);
                }, [controller, setIsOpen, setController]),
                controller
            };
        },
        paramsControl,
        controller: {
            open: (p: T = {} as T) => {
                paramsControl.next(p);
                isOpenControl.next(true);
            },
            close: () => {
                isOpenControl.next(true);
                controllerControl.value.abort('Modal Closed');
                setTimeout(() => controllerControl.next(new AbortController()), 2000);
            }
        }
    };
};
