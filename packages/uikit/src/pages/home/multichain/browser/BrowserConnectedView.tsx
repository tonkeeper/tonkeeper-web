import { ComponentProps, FC, useCallback, useState } from 'react';

import { useTranslation } from '../../../../hooks/translation';
import { useAppSdk } from '../../../../hooks/appSdk';
import { useToastMutationError } from '../../../../hooks/useNotification';
import { cn } from '../../../../libs/css';
import { Button, SkeletonScope } from '../../../../primitives';
import { InlineRetryRow } from '../../../../components/shared/InlineRetryRow';
import { ModalCenterError } from '../../../../components/shared/ModalCenterState';
import IcApps28 from '../../../../icons/components/IcApps28';
import IcExclamationmarkCircle28 from '../../../../icons/components/IcExclamationmarkCircle28';
import { useDisconnectEvmInjectedConnection } from '../../../../state/evmInjected';
import { useDisconnectTonConnectAppFromActiveWallet } from '../../../../state/tonConnect';
import {
    MultichainConnectedApp,
    useDisconnectWalletConnectSession,
    useMultichainConnectedApps
} from '../../../../state/walletConnect';
import { ConnectPasteSheet } from '../connect/ConnectPasteSheet';
import { ConnectedAppTile } from '../connect/ConnectedAppTile';
import { PLACEHOLDER_BROWSER_APPS } from '../multichain-placeholders';
import { BrowserServiceCard } from './BrowserServiceCard';
import { DisconnectAppSheet } from '../connect/DisconnectAppSheet';
import { DisconnectAppToast } from '../connect/DisconnectAppToast';
import { useOpenConnectedApp } from './browser-utils';

/**
 * Figma "Browser/Connected/Empty" content block, minus its Connect dApp
 * button — the page docks that button at the bottom of the Connected tab
 * instead. Centres itself in whatever height the page column grants it, so
 * the tab never grows past the viewport on a short window.
 */
export const BrowserConnectedEmpty: FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    return (
        <div
            className={cn(
                'flex flex-1 flex-col items-center justify-center px-8 py-16 text-center',
                className
            )}
        >
            <IcApps28 className="size-14 text-textAccent" />
            <div className="whitespace-pre-line pt-4 text-h3 text-textPrimary">
                {t('browser_connected_empty_title')}
            </div>
            <div className="whitespace-pre-line pt-1 text-body1 text-textSecondary">
                {t('browser_connected_empty_text')}
            </div>
        </div>
    );
};

/**
 * Whether this shell offers wallet-side WalletConnect pairing. The extension
 * doesn't: there dApps connect through the injected providers (TonConnect JS
 * bridge, EIP-6963), and the relay rejects extension origins unless each one
 * is allowlisted.
 */
export function useCanConnectDapp(): boolean {
    const sdk = useAppSdk();
    return sdk.targetEnv !== 'extension';
}

/**
 * Opens the paste-a-link connect sheet (TonConnect or WalletConnect).
 * Renders nothing where pairing isn't offered (see
 * {@link useCanConnectDapp}). Button styling is
 * the caller's: the page docks it in place of the search control, styled
 * like the control it replaces.
 */
export const ConnectDappButton: FC<
    Pick<ComponentProps<typeof Button>, 'variant' | 'size' | 'fullWidth' | 'leftIcon'>
> = ({ variant, size, fullWidth, leftIcon }) => {
    const { t } = useTranslation();
    const canConnect = useCanConnectDapp();
    const [open, setOpen] = useState(false);
    if (!canConnect) {
        return null;
    }
    return (
        <>
            <Button
                variant={variant}
                size={size}
                fullWidth={fullWidth}
                leftIcon={leftIcon}
                onClick={() => setOpen(true)}
            >
                {t('connect_dapp_title')}
            </Button>
            <ConnectPasteSheet isOpen={open} onClose={() => setOpen(false)} />
        </>
    );
};

/**
 * Connected tab: the active wallet's dApp connections across all
 * protocols — TonConnect, WalletConnect and injected EVM — as the
 * Service Card grid. Disconnect splits by input: hover reveals a close
 * pill that opens the confirmation modal (desktop), a touch long-press
 * shows the disconnect toast (native-iOS behavior).
 */
export const BrowserConnectedView: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const { t } = useTranslation();
    const openConnectedApp = useOpenConnectedApp();
    const { data: apps, isLoading, isError, refetch } = useMultichainConnectedApps();
    const toastError = useToastMutationError();
    const [toDisconnect, setToDisconnect] = useState<MultichainConnectedApp | undefined>();
    const [toastApp, setToastApp] = useState<MultichainConnectedApp | undefined>();
    const closeToast = useCallback(() => setToastApp(undefined), []);

    const { mutate: disconnectTonConnect } = useDisconnectTonConnectAppFromActiveWallet();
    const { mutate: disconnectWalletConnect } = useDisconnectWalletConnectSession();
    const { mutate: disconnectEvmInjected } = useDisconnectEvmInjectedConnection();

    const disconnect = (app: MultichainConnectedApp) => {
        const options = { onError: toastError };
        if (app.protocol === 'walletConnect') {
            disconnectWalletConnect(app.key, options);
        } else if (app.protocol === 'evmInjected') {
            disconnectEvmInjected(app.key, options);
        } else {
            disconnectTonConnect({ origin: app.key }, options);
        }
    };

    if (isLoading || apps === undefined) {
        // Same 88px tile geometry as the loaded grid — the connected tile and
        // the service card share the Figma tile shape.
        return (
            <SkeletonScope loading>
                <div className="-mx-1 grid grid-cols-[repeat(auto-fill,88px)] justify-between">
                    {PLACEHOLDER_BROWSER_APPS.map(app => (
                        <BrowserServiceCard key={app.id} app={app} onClick={() => undefined} />
                    ))}
                </div>
            </SkeletonScope>
        );
    }

    if (apps.length === 0) {
        // Nothing loaded and a store failed: the empty state would claim no
        // apps are connected when that is exactly what couldn't be read.
        if (isError) {
            return (
                <div className="pt-16">
                    <ModalCenterError icon={<IcExclamationmarkCircle28 />} onRetry={refetch} />
                </div>
            );
        }
        // In the compact shell the column's bottom padding and the search
        // fade are blank space too; pulling the block over them keeps it
        // midway between the tab row and the search pill.
        return <BrowserConnectedEmpty className={compact ? '-mb-16 -mt-2' : undefined} />;
    }

    return (
        <>
            <div className="-mx-1 grid grid-cols-[repeat(auto-fill,88px)] justify-between">
                {apps.map(app => (
                    <ConnectedAppTile
                        key={`${app.protocol}-${app.key}`}
                        name={app.name}
                        icon={app.icon}
                        chains={app.chains}
                        onOpen={() => openConnectedApp(app)}
                        onRequestDisconnect={() => setToDisconnect(app)}
                        onLongPress={() => setToastApp(app)}
                    />
                ))}
            </div>
            {isError && (
                <InlineRetryRow
                    text={t('connected_apps_partial_error')}
                    onRetry={refetch}
                    className="mt-2 rounded-medium bg-backgroundContent"
                />
            )}
            <DisconnectAppSheet
                isOpen={toDisconnect !== undefined}
                appName={toDisconnect?.name}
                appIcon={toDisconnect?.icon}
                onDisconnect={() => {
                    if (toDisconnect) {
                        disconnect(toDisconnect);
                    }
                    setToDisconnect(undefined);
                }}
                onCancel={() => setToDisconnect(undefined)}
            />
            {toastApp && (
                <DisconnectAppToast
                    key={`${toastApp.protocol}-${toastApp.key}`}
                    appName={toastApp.name}
                    onDisconnect={() => {
                        disconnect(toastApp);
                        setToastApp(undefined);
                    }}
                    onClose={closeToast}
                />
            )}
        </>
    );
};
