import { FC, PropsWithChildren } from 'react';
import { TargetEnv } from '@tonkeeper/core/dist/AppSdk';
import { useAppTargetEnv, useIsCapacitorApp } from '../../hooks/appSdk';

export const ForTargetEnv: FC<PropsWithChildren<{ env: TargetEnv | TargetEnv[] }>> = ({
    children,
    env
}) => {
    const targetEnv = Array.isArray(env) ? env : [env];
    const currentEnv = useAppTargetEnv();

    return targetEnv.includes(currentEnv) ? <>{children}</> : null;
};

export const NotForTargetEnv: FC<PropsWithChildren<{ env: TargetEnv | TargetEnv[] }>> = ({
    children,
    env
}) => {
    const targetEnv = Array.isArray(env) ? env : [env];
    const currentEnv = useAppTargetEnv();

    return !targetEnv.includes(currentEnv) ? <>{children}</> : null;
};

export const ForCapacitorApp: FC<PropsWithChildren> = ({ children }) => {
    const isCapacitorApp = useIsCapacitorApp();
    return isCapacitorApp ? <>{children}</> : null;
};

export const NotForCapacitorApp: FC<PropsWithChildren> = ({ children }) => {
    const isCapacitorApp = useIsCapacitorApp();
    return !isCapacitorApp ? <>{children}</> : null;
};
