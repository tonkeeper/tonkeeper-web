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
import { useAtom } from '../../libs/atom';
import { useProFeaturesNotification } from './ProFeaturesNotificationControlled';
import { useProState } from '../../state/pro';
import { CreateStandardWallet } from '../../pages/import/CreateStandardWallet';
import { CreateMAMWallet } from '../../pages/import/CreateMAMWallet';
import { ImportExistingWallet } from '../../pages/import/ImportExistingWallet';
import { CreateWatchOnlyWallet } from '../../pages/import/CreateWatchOnlyWallet';
import { CreateSignerWallet } from '../../pages/import/CreateSignerWallet';
import { CreateKeystoneWallet } from '../../pages/import/CreateKeystoneWallet';
import { CreateLedgerWallet } from '../../pages/import/CreateLedgerWallet';

const { hook, paramsControl } = createModalControl<{ walletType?: AddWalletMethod } | undefined>();

export const useAddWalletNotification = hook;

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
        if (params?.walletType === 'multisig' && !proState?.subscription.valid) {
            onClose();
            openBuyPro();
            return;
        }

        setSelectedMethod(params?.walletType);
    }, [isOpen, params?.walletType, proState?.subscription.valid, openBuyPro, onClose]);

    const onCloseCallback = useCallback(() => {
        onClose();
        setTimeout(() => setSelectedMethod(undefined), 600);
    }, [onClose, setSelectedMethod]);

    const onSelect = useCallback(() => {
        return (path: AddWalletMethod) => {
            if (path === 'multisig' && !proState?.subscription.valid) {
                openBuyPro();
                return;
            }
            setSelectedMethod(path);
        };
    }, [proState?.subscription.valid, openBuyPro, setSelectedMethod]);

    const Content = useCallback(() => {
        if (!selectedMethod) {
            return (
                <NotificationContentWrapper>
                    <Heading>{t('import_add_wallet')}</Heading>
                    <SubHeading>{t('import_add_wallet_description')}</SubHeading>
                    <AddWalletContent onSelect={onSelect()} />
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
            <NotificationStyled isOpen={isOpen} handleClose={onCloseCallback} mWidth={'750px'}>
                {Content}
            </NotificationStyled>
        </AddWalletContext.Provider>
    );
};
