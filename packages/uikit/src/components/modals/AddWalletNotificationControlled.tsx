import { Notification } from '../Notification';
import { createModalControl } from './createModalControl';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AddWalletContent, AddWalletMethod } from '../create/AddWallet';
import styled, { css } from 'styled-components';
import { Body1, Body2Class, H2, Label2Class } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { CreateMultisig } from '../create/Multisig';
import { AddWalletContext } from '../create/AddWalletContext';
import { useAtom } from '../../libs/useAtom';
import { useProState } from '../../state/pro';
import { CreateStandardWallet } from '../../pages/import/CreateStandardWallet';
import { CreateMAMWallet } from '../../pages/import/CreateMAMWallet';
import { ImportExistingWallet } from '../../pages/import/ImportExistingWallet';
import { CreateWatchOnlyWallet } from '../../pages/import/CreateWatchOnlyWallet';
import { CreateSignerWallet } from '../../pages/import/CreateSignerWallet';
import { CreateKeystoneWallet } from '../../pages/import/CreateKeystoneWallet';
import { CreateLedgerWallet } from '../../pages/import/CreateLedgerWallet';
import { useAppSdk } from '../../hooks/appSdk';
import { ImportTestnetWallet } from '../../pages/import/ImportTestnetWallet';
import { useSecurityCheck } from '../../state/password';
import { isValidSubscription } from '@tonkeeper/core/dist/entries/pro';
import { ImportBySKWallet } from '../../pages/import/ImportBySKWallet';
import { useProFeaturesNotification } from './ProFeaturesNotificationControlled';

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

const doesMethodRequirePro = (method: AddWalletMethod | undefined): boolean => {
    return method === 'multisig' || method === 'sk_fireblocks';
};

export const AddWalletNotificationControlled = () => {
    const { onOpen: openBuyPro } = useProFeaturesNotification();
    const { data: proState } = useProState();
    const { isOpen, onClose } = useAddWalletNotification();
    const [params] = useAtom(paramsControl);
    const { t } = useTranslation();
    const [selectedMethod, setSelectedMethod] = useState<AddWalletMethod | undefined>(
        params?.walletType
    );

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        if (doesMethodRequirePro(params?.walletType) && !isValidSubscription(proState?.current)) {
            onClose();
            openBuyPro();
            return;
        }

        setSelectedMethod(params?.walletType);
    }, [isOpen, params?.walletType, proState?.current?.valid]);

    const sdk = useAppSdk();

    const onCloseCallback = useCallback(() => {
        onClose();
    }, [onClose, setSelectedMethod, sdk]);

    const onSelect = useMemo(() => {
        return (method: AddWalletMethod) => {
            if (doesMethodRequirePro(method) && !isValidSubscription(proState?.current)) {
                onClose();
                openBuyPro();
                return;
            }

            setSelectedMethod(method);
        };
    }, [proState?.current?.valid, openBuyPro, setSelectedMethod, sdk]);

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
