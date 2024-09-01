import { Notification } from '../Notification';
import { createModalControl } from './createModalControl';
import React, { useCallback } from 'react';
import { AddWalletContent } from '../create/AddWallet';
import styled, { css } from 'styled-components';
import { Body1, Body2Class, H2, Label2Class } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { useOnImportAction } from '../../hooks/appSdk';

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

const NotificationStyled = styled(Notification)`
    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            max-width: 750px;

            .dialog-header {
                padding-bottom: 0;
            }
        `}
`;

export const AddWalletNotificationControlled = () => {
    const { isOpen, onClose } = useAddWalletNotification();
    const { t } = useTranslation();
    const onImport = useOnImportAction();

    const Content = useCallback(
        (closed: (after: () => void) => void) => {
            return (
                <NotificationContentWrapper>
                    <Heading>{t('import_add_wallet')}</Heading>
                    <SubHeading>{t('import_add_wallet_description')}</SubHeading>
                    <AddWalletContent onSelect={path => closed(() => onImport(path))} />
                </NotificationContentWrapper>
            );
        },
        [onImport, t]
    );

    return (
        <NotificationStyled isOpen={isOpen} handleClose={onClose}>
            {Content}
        </NotificationStyled>
    );
};
