import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ComponentType, FC, Fragment, PropsWithChildren, useEffect, useState } from 'react';

import IcExclamationmarkCircle28 from '../../icons/components/IcExclamationmarkCircle28';
import { ErrorBoundary } from './ErrorBoundary';
import { ModalCenterError } from './ModalCenterState';

/**
 * Last-resort boundary around a shell's whole tree. Without it a render-time
 * throw — including a failed `suspense` query, which react-query rethrows into
 * render — unmounts the app and leaves an empty page. Retry also resets
 * react-query's error state so the failed queries refetch instead of
 * rethrowing their cached error. Coming back online retries on its own, since
 * a boot without network is the usual way to land here.
 *
 * `FallbackRoot` lets a shell give the error screen the box its content
 * normally gets from a layout that is no longer mounted (e.g. popup geometry).
 */
export const RootErrorBoundary: FC<
    PropsWithChildren<{ FallbackRoot?: ComponentType<PropsWithChildren> }>
> = ({ children, FallbackRoot = Fragment }) => {
    const { reset } = useQueryErrorResetBoundary();
    const [onlineCount, setOnlineCount] = useState(0);

    useEffect(() => {
        const onOnline = () => setOnlineCount(c => c + 1);
        window.addEventListener('online', onOnline);
        return () => window.removeEventListener('online', onOnline);
    }, []);

    return (
        <ErrorBoundary
            onReset={reset}
            resetKeys={[onlineCount]}
            fallbackRender={({ resetErrorBoundary }) => (
                <FallbackRoot>
                    <div className="flex min-h-[var(--app-height,100vh)] w-full items-center justify-center bg-backgroundPage">
                        <ModalCenterError
                            icon={<IcExclamationmarkCircle28 />}
                            onRetry={resetErrorBoundary}
                        />
                    </div>
                </FallbackRoot>
            )}
        >
            {children}
        </ErrorBoundary>
    );
};
