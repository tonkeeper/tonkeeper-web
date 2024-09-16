import { Notification } from '../Notification';
import { createModalControl } from './createModalControl';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AddWalletContent } from '../create/AddWallet';
import styled, { css } from 'styled-components';
import { Body1, Body2Class, H2, Label2Class } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { useOnImportAction } from '../../hooks/appSdk';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { CreateMultisig } from '../create/Multisig';
import { AddWalletContext } from '../create/AddWalletContext';
import { useAtom } from '../../libs/atom';
import { useProFeaturesNotification } from './ProFeaturesNotificationControlled';
import { useProState } from '../../state/pro';

const { hook, paramsControl } = createModalControl<{ walletType?: MethodsInModal } | undefined>();

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

const methodsInModal = ['multisig'] as const;
type MethodsInModal = (typeof methodsInModal)[number];

export const AddWalletNotificationControlled = () => {
    const { onOpen: openBuyPro } = useProFeaturesNotification();
    const { data: proState } = useProState();
    const { isOpen, onClose } = useAddWalletNotification();
    const [params] = useAtom(paramsControl);
    const { t } = useTranslation();
    const onImport = useOnImportAction();
    const [selectedMethod, setSelectedMethod] = useState<MethodsInModal | undefined>(
        params?.walletType
    );

    useEffect(() => {
        setSelectedMethod(params?.walletType);
    }, [params?.walletType]);

    const onCloseCallback = useCallback(() => {
        onClose();
        setTimeout(() => setSelectedMethod(undefined), 400);
    }, [onClose, setSelectedMethod]);

    const onSelect = useCallback(
        (closed: (after: () => void) => void) => {
            return (path: string) => {
                if (methodsInModal.includes(path as MethodsInModal)) {
                    if (path === 'multisig' && !proState?.subscription.valid) {
                        openBuyPro();
                        return;
                    }
                    setSelectedMethod(path as MethodsInModal);
                } else {
                    closed(() => onImport(path));
                }
            };
        },
        [proState?.subscription.valid, openBuyPro, setSelectedMethod, onImport]
    );

    const Content = useCallback(
        (closed: (after: () => void) => void) => {
            if (!selectedMethod) {
                return (
                    <NotificationContentWrapper>
                        <Heading>{t('import_add_wallet')}</Heading>
                        <SubHeading>{t('import_add_wallet_description')}</SubHeading>
                        <AddWalletContent onSelect={onSelect(closed)} />
                    </NotificationContentWrapper>
                );
            }

            switch (selectedMethod) {
                case 'multisig': {
                    return <CreateMultisig onClose={onCloseCallback} />;
                }
                default: {
                    assertUnreachable(selectedMethod);
                }
            }
        },
        [onImport, t, selectedMethod, onCloseCallback, onSelect]
    );

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
