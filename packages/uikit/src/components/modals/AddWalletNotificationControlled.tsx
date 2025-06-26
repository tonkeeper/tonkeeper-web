import { Notification } from '../Notification';
import { createModalControl } from './createModalControl';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AddWalletContent, addWalletMethod, AddWalletMethod } from '../create/AddWallet';
import styled, { css } from 'styled-components';
import { Body1, Body2Class, H2, Label2Class } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { CreateMultisig } from '../create/Multisig';
import { AddWalletContext } from '../create/AddWalletContext';
import { useAtom } from '../../libs/useAtom';
import { useProFeaturesNotification } from './ProFeaturesNotificationControlled';
import { useProState } from '../../state/pro';
import { CreateStandardWallet } from '../../pages/import/CreateStandardWallet';
import { CreateMAMWallet } from '../../pages/import/CreateMAMWallet';
import { ImportExistingWallet } from '../../pages/import/ImportExistingWallet';
import { CreateWatchOnlyWallet } from '../../pages/import/CreateWatchOnlyWallet';
import { CreateSignerWallet } from '../../pages/import/CreateSignerWallet';
import { CreateKeystoneWallet } from '../../pages/import/CreateKeystoneWallet';
import { CreateLedgerWallet } from '../../pages/import/CreateLedgerWallet';
import { useAppSdk } from '../../hooks/appSdk';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { ImportTestnetWallet } from '../../pages/import/ImportTestnetWallet';
import { useSecurityCheck } from '../../state/password';
import { ImportBySKWallet } from '../../pages/import/ImportBySKWallet';

const { hook, paramsControl } = createModalControl<{ walletType?: AddWalletMethod } | undefined>();

export const useAddWalletNotification = () => {
    const { mutateAsync: securityCheck } = useSecurityCheck();
    const { onOpen: onOpenHook, ...rest } = hook();

    const onOpen = useCallback<typeof onOpenHook>(
        async p => {
            try {
                if (p?.walletType) {
                    await securityCheck();
                }

                onOpenHook(p);
            } catch (e) {
                console.error(e);
            }
        },
        [securityCheck, onOpenHook]
    );

    return {
        ...rest,
        onOpen
    };
};

const NotificationContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Heading = styled(H2)`
    ${p => p.theme.displayType === 'full-width' && Label2Class};
    margin-bottom: 4px;
    text-align: center;
`;

const SubHeading = styled(Body1)`
    ${p => p.theme.displayType === 'full-width' && Body2Class};
    color: ${p => p.theme.textSecondary};
    margin-bottom: 24px;
    text-align: center;
`;

const NotificationStyled = styled(Notification)<{ mWidth: string | undefined }>`
    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            ${p.mWidth &&
            css`
                max-width: ${p.mWidth};
            `}

            .dialog-header {
                padding-bottom: 0;
            }
        `}
`;

const ADD_WALLET_QUERY = 'add_wallet';

const openExtensionTab = (sdk: IAppSdk, forMethod: AddWalletMethod) => {
    const urlParams = new URLSearchParams(window.location.search);
    const methodName = urlParams.get(ADD_WALLET_QUERY);

    if (
        !methodName &&
        'openExtensionInBrowser' in sdk &&
        typeof sdk.openExtensionInBrowser === 'function'
    ) {
        sdk.openExtensionInBrowser(null, `?${ADD_WALLET_QUERY}=${forMethod}`);
    }
};

const closeExtensionTab = (sdk: IAppSdk) => {
    const urlParams = new URLSearchParams(window.location.search);
    const methodName = urlParams.get(ADD_WALLET_QUERY);

    if (
        methodName &&
        'closeExtensionInBrowser' in sdk &&
        typeof sdk.closeExtensionInBrowser === 'function'
    ) {
        sdk.closeExtensionInBrowser();
    }
};

const doesMethodRequirePro = (method: AddWalletMethod): boolean => {
    return method === 'multisig' || method === 'sk_fireblocks';
};

export const AddWalletNotificationControlled = () => {
    const { onOpen: openBuyPro } = useProFeaturesNotification();
    const { data: proState } = useProState();
    const { isOpen, onClose, onOpen } = useAddWalletNotification();
    const [params] = useAtom(paramsControl);
    const { t } = useTranslation();
    const [selectedMethod, setSelectedMethod] = useState<AddWalletMethod | undefined>(
        params?.walletType
    );

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const methodName = urlParams.get(ADD_WALLET_QUERY);

        if (!methodName) {
            return;
        }
        if (addWalletMethod.includes(methodName as AddWalletMethod)) {
            onOpen({ walletType: methodName as AddWalletMethod });
        } else {
            onOpen();
        }
    }, []);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setSelectedMethod(params?.walletType);
    }, [isOpen, params?.walletType, proState?.subscription.valid, openBuyPro, onClose]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        if (params?.walletType === 'multisig' && !proState?.subscription.valid) {
            onClose();
            openBuyPro();
            return;
        }
    }, [isOpen, params?.walletType, proState?.subscription.valid, openBuyPro, onClose]);

    const sdk = useAppSdk();

    const onCloseCallback = useCallback(() => {
        closeExtensionTab(sdk);
        onClose();
    }, [onClose, setSelectedMethod, sdk]);

    const onSelect = useMemo(() => {
        return (method: AddWalletMethod) => {
            if (doesMethodRequirePro(method) && !proState?.subscription.valid) {
                openBuyPro();
                return;
            }

            openExtensionTab(sdk, method);
            setSelectedMethod(method);
        };
    }, [proState?.subscription.valid, openBuyPro, setSelectedMethod, sdk]);

    const Content = useCallback(() => {
        if (!selectedMethod) {
            return (
                <NotificationContentWrapper>
                    <Heading>{t('import_add_wallet')}</Heading>
                    <SubHeading>{t('import_add_wallet_description')}</SubHeading>
                    <AddWalletContent onSelect={onSelect} />
                </NotificationContentWrapper>
            );
        }

        switch (selectedMethod) {
            case 'multisig': {
                return <CreateMultisig onClose={onCloseCallback} />;
            }
            case 'create-standard': {
                return <CreateStandardWallet afterCompleted={onCloseCallback} />;
            }
            case 'create-mam': {
                return <CreateMAMWallet afterCompleted={onCloseCallback} />;
            }
            case 'testnet': {
                return <ImportTestnetWallet afterCompleted={onCloseCallback} />;
            }
            case 'import': {
                return <ImportExistingWallet afterCompleted={onCloseCallback} />;
            }
            case 'watch-only': {
                return <CreateWatchOnlyWallet afterCompleted={onCloseCallback} />;
            }
            case 'signer': {
                return <CreateSignerWallet afterCompleted={onCloseCallback} />;
            }
            case 'keystone': {
                return <CreateKeystoneWallet afterCompleted={onCloseCallback} />;
            }
            case 'ledger': {
                return <CreateLedgerWallet afterCompleted={onCloseCallback} />;
            }
            case 'sk_fireblocks': {
                return (
                    <ImportBySKWallet
                        signingAlgorithm="fireblocks"
                        afterCompleted={onCloseCallback}
                    />
                );
            }
            default: {
                assertUnreachable(selectedMethod);
            }
        }
    }, [t, selectedMethod, onCloseCallback, onSelect]);

    const navigateHome = useMemo(
        () =>
            !params?.walletType
                ? () => {
                      setSelectedMethod(undefined);
                  }
                : undefined,
        [params?.walletType]
    );

    return (
        <AddWalletContext.Provider value={{ navigateHome }}>
            <NotificationStyled
                isOpen={isOpen}
                handleClose={onCloseCallback}
                mWidth={'750px'}
                mobileFullScreen
                afterClose={() => {
                    setSelectedMethod(undefined);
                }}
                tag={`add-wallet-${selectedMethod}`}
            >
                {Content}
            </NotificationStyled>
        </AddWalletContext.Provider>
    );
};
