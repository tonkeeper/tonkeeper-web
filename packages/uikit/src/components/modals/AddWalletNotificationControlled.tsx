import { Notification } from '../Notification';
import { createModalControl } from './createModalControl';
import React, { useCallback, useMemo, useState } from 'react';
import { AddWalletContent } from '../create/AddWallet';
import styled, { css } from 'styled-components';
import { Body1, Body2Class, H2, Label2Class } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { useOnImportAction } from '../../hooks/appSdk';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { CreateMultisig } from '../create/Multisig';
import { useConfirmDiscardNotification } from './ConfirmDiscardNotificationControlled';

const { hook } = createModalControl();

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
    const { isOpen, onClose } = useAddWalletNotification();
    const { onOpen: askDiscard } = useConfirmDiscardNotification();
    const { t } = useTranslation();
    const onImport = useOnImportAction();
    const [selectedMethod, setSelectedMethod] = useState<MethodsInModal | undefined>(undefined);

    const [onBack, setOnBack] = useState<(() => void) | undefined | 'navigate-back'>(
        'navigate-back'
    );

    const onCloseCallback = useCallback(() => {
        askDiscard({
            onClose: (confirmDiscard: boolean) => {
                if (confirmDiscard) {
                    onClose();
                    setTimeout(() => {
                        setSelectedMethod(undefined);
                        setOnBack('navigate-back');
                    }, 400);
                }
            }
        });
    }, [onClose, askDiscard]);

    const Content = useCallback(
        (closed: (after: () => void) => void) => {
            if (!selectedMethod) {
                return (
                    <NotificationContentWrapper>
                        <Heading>{t('import_add_wallet')}</Heading>
                        <SubHeading>{t('import_add_wallet_description')}</SubHeading>
                        <AddWalletContent
                            onSelect={path => {
                                if (methodsInModal.includes(path as MethodsInModal)) {
                                    setSelectedMethod(path as MethodsInModal);
                                } else {
                                    closed(() => onImport(path));
                                }
                            }}
                        />
                    </NotificationContentWrapper>
                );
            }

            switch (selectedMethod) {
                case 'multisig': {
                    return <CreateMultisig setOnBack={setOnBack} onClose={onCloseCallback} />;
                }
                default: {
                    assertUnreachable(selectedMethod);
                }
            }
        },
        [onImport, t, selectedMethod, setOnBack, onCloseCallback]
    );

    const onBackCallback = useMemo(() => {
        if (!selectedMethod) {
            return undefined;
        }
        if (onBack === 'navigate-back') {
            return () => setSelectedMethod(undefined);
        } else {
            return onBack;
        }
    }, [onBack, selectedMethod]);

    return (
        <NotificationStyled
            isOpen={isOpen}
            handleClose={onCloseCallback}
            onBack={onBackCallback}
            mWidth={'750px'}
        >
            {Content}
        </NotificationStyled>
    );
};
