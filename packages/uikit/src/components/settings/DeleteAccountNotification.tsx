import { FC, useCallback, useState } from 'react';
import styled from 'styled-components';
import { Account, AccountId } from '@tonkeeper/core/dist/entries/account';
import { isPaidSubscription } from '@tonkeeper/core/dist/entries/pro';

import { useTranslation } from '../../hooks/translation';
import { AppRoute } from '../../libs/routes';
import { useMutateDeleteAll, useMutateLogOut } from '../../state/wallet';
import { Notification } from '../Notification';
import { Body2, Body3, Body3Class, Label2 } from '../Text';
import { Button } from '../fields/Button';
import { Checkbox } from '../fields/Checkbox';
import { useRecoveryNotification } from '../modals/RecoveryNotificationControlled';
import { useNavigate } from '../../hooks/router/useNavigate';
import { hexToRGBA } from '../../libs/css';
import { BorderSmallResponsive } from '../shared/Styles';
import { ExclamationMarkTriangleIcon } from '../Icon';
import { useDeleteActiveWalletWarning } from '../../hooks/pro/useDeleteActiveWalletWarning';
import { useProState } from '../../state/pro';

export const DeleteNotificationContent: FC<{
    onClose: () => void;
    accountId: AccountId;
    isKeystone: boolean;
    isReadOnly: boolean;
}> = props => {
    const { onClose, accountId, isKeystone, isReadOnly } = props;
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [checked, setChecked] = useState(isKeystone || isReadOnly);
    const { mutateAsync, isLoading } = useMutateLogOut();
    const { onOpen: onRecovery } = useRecoveryNotification();
    const { isWarningVisible } = useDeleteActiveWalletWarning();

    const onDelete = async () => {
        await mutateAsync(accountId);
        onClose();
        navigate(AppRoute.home);
    };

    return (
        <NotificationBlock>
            <TextBlock>
                <Label2>{t('Delete_wallet_data')}</Label2>
                <BodyText>
                    {t(
                        isKeystone
                            ? 'Delete_keystone_wallet_data_description'
                            : 'Delete_wallet_data_description'
                    )}
                </BodyText>
            </TextBlock>

            <CentralBlockStyled>
                {isWarningVisible && (
                    <WarningBlock>
                        <span>{t('deleting_wallet_warning')}</span>
                        <ExclamationMarkTriangleIconStyled />
                    </WarningBlock>
                )}

                {!isKeystone && !isReadOnly && (
                    <DisclaimerBlock>
                        <DisclaimerLink
                            onClick={() => {
                                onRecovery({ accountId });
                                onClose();
                            }}
                        >
                            <DisclaimerText>
                                {t('I_have_a_backup_copy_of_recovery_phrase')}
                            </DisclaimerText>
                            {t('Back_up_now')}
                        </DisclaimerLink>
                        <Checkbox checked={checked} onChange={setChecked} light />
                    </DisclaimerBlock>
                )}
            </CentralBlockStyled>

            {(isKeystone || isReadOnly) && <div style={{ height: 16 }} />}

            <ButtonStyled
                disabled={!checked}
                size="large"
                fullWidth
                loading={isLoading}
                onClick={onDelete}
                type="button"
            >
                {t('Delete_wallet_data')}
            </ButtonStyled>
        </NotificationBlock>
    );
};

export const DeleteAccountNotification: FC<{
    account?: Account;
    handleClose: () => void;
}> = ({ account, handleClose }) => {
    const Content = useCallback(
        (afterClose: () => void) => {
            if (!account) return undefined;
            return (
                <DeleteNotificationContent
                    accountId={account.id}
                    onClose={afterClose}
                    isKeystone={account.type === 'keystone'}
                    isReadOnly={account.type === 'watch-only'}
                />
            );
        },
        [account]
    );

    return (
        <Notification isOpen={account != null} handleClose={handleClose}>
            {Content}
        </Notification>
    );
};

const DeleteAllContent = () => {
    const { t } = useTranslation();
    const [checked, setChecked] = useState(false);
    const { mutate, isLoading } = useMutateDeleteAll();
    const { data: subscription } = useProState();

    return (
        <NotificationBlock>
            <TextBlock>
                <Label2>{t('Delete_wallet_data')}</Label2>
                <BodyText>{t('Delete_wallet_data_description')}</BodyText>
            </TextBlock>

            <CentralBlockStyled>
                {isPaidSubscription(subscription) && (
                    <WarningBlock>
                        <span>{t('deleting_wallets_warning')}</span>
                        <ExclamationMarkTriangleIconStyled />
                    </WarningBlock>
                )}

                <DisclaimerBlock>
                    <Body3>{t('I_have_a_backup_copy_of_recovery_phrase')}</Body3>
                    <Checkbox checked={checked} onChange={setChecked} light />
                </DisclaimerBlock>
            </CentralBlockStyled>

            <ButtonStyled
                disabled={!checked}
                size="large"
                fullWidth
                loading={isLoading}
                onClick={() => mutate()}
                type="button"
            >
                {t('Delete_wallet_data')}
            </ButtonStyled>
        </NotificationBlock>
    );
};

export const DeleteAllNotification: FC<{
    open: boolean;
    handleClose: () => void;
}> = ({ open, handleClose }) => {
    const Content = useCallback(() => {
        if (!open) return undefined;
        return <DeleteAllContent />;
    }, [open]);

    return (
        <Notification isOpen={open} handleClose={handleClose}>
            {Content}
        </Notification>
    );
};

const NotificationBlock = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
`;

const CentralBlockStyled = styled.div`
    width: 100%;
`;

const BodyText = styled(Body2)`
    color: ${props => props.theme.textSecondary};
`;
const TextBlock = styled.div`
    display: flex;
    flex-direction: column;
    text-align: center;
`;

const DisclaimerBlock = styled.div`
    ${Body3Class};

    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 8px 16px 8px 12px;
    box-sizing: border-box;

    ${BorderSmallResponsive};
    background: ${props => props.theme.backgroundContent};
`;

const DisclaimerText = styled(Label2)`
    display: flex;
    flex-direction: column;

    ${Body3Class};
    color: ${({ theme }) => theme.textPrimary};
`;

const DisclaimerLink = styled(Body3)`
    cursor: pointer;
    color: ${props => props.theme.textAccent};
`;

const WarningBlock = styled.div`
    display: flex;
    gap: 24px;
    ${BorderSmallResponsive};
    margin-bottom: 8px;
    padding: 8px 16px 8px 12px;
    justify-content: space-between;

    ${Body3Class};
    background: ${p => hexToRGBA(p.theme.accentOrange, 0.16)};
    color: ${p => p.theme.accentOrange};
`;

const ExclamationMarkTriangleIconStyled = styled(ExclamationMarkTriangleIcon)`
    min-width: 24px;
    min-height: 24px;
`;

const ButtonStyled = styled(Button)`
    text-transform: capitalize;
`;
