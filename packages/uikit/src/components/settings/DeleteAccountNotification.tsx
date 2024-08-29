import { useQueryClient } from '@tanstack/react-query';
import { Account, AccountId } from '@tonkeeper/core/dist/entries/account';
import { FC, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { AppRoute, SettingsRoute } from '../../libs/routes';
import { useMutateDeleteAll, useMutateLogOut } from '../../state/wallet';
import { Notification } from '../Notification';
import { Body1, H2, Label1, Label2 } from '../Text';
import { Button } from '../fields/Button';
import { Checkbox } from '../fields/Checkbox';
import { DisclaimerBlock } from '../home/BuyItemNotification';

const NotificationBlock = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const BodyText = styled(Body1)`
    color: ${props => props.theme.textSecondary};
`;
const TextBlock = styled.div`
    text-align: center;
`;

const DisclaimerText = styled(Label2)`
    display: flex;
`;

const DisclaimerLink = styled(Label1)`
    cursor: pointer;
    color: ${props => props.theme.textAccent};
    margin-left: 2.35rem;
`;

const DeleteContent: FC<{
    onClose: (action: () => void) => void;
    accountId: AccountId;
    isKeystone: boolean;
    isReadOnly: boolean;
}> = ({ onClose, accountId, isKeystone, isReadOnly }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [checked, setChecked] = useState(isKeystone || isReadOnly);
    const { mutateAsync, isLoading } = useMutateLogOut();

    const onDelete = async () => {
        await mutateAsync(accountId);
        onClose(() => navigate(AppRoute.home));
    };

    return (
        <NotificationBlock>
            <TextBlock>
                <H2>{t('Delete_wallet_data')}</H2>
                <BodyText>
                    {t(
                        isKeystone
                            ? 'Delete_keystone_wallet_data_description'
                            : 'Delete_wallet_data_description'
                    )}
                </BodyText>
            </TextBlock>
            {!isKeystone && !isReadOnly && (
                <DisclaimerBlock>
                    <DisclaimerText>
                        <Checkbox checked={checked} onChange={setChecked} light>
                            {t('I_have_a_backup_copy_of_recovery_phrase')}
                        </Checkbox>
                    </DisclaimerText>
                    <DisclaimerLink
                        onClick={() =>
                            onClose(() =>
                                navigate(
                                    AppRoute.settings + SettingsRoute.recovery + '/' + accountId
                                )
                            )
                        }
                    >
                        {t('Back_up_now')}
                    </DisclaimerLink>
                </DisclaimerBlock>
            )}
            {(isKeystone || isReadOnly) && <div style={{ height: 16 }} />}
            <Button
                disabled={!checked}
                size="large"
                fullWidth
                loading={isLoading}
                onClick={onDelete}
                type="button"
            >
                {t('Delete_wallet_data')}
            </Button>
        </NotificationBlock>
    );
};

export const DeleteAccountNotification: FC<{
    account?: Account;
    handleClose: () => void;
}> = ({ account, handleClose }) => {
    const Content = useCallback(
        (afterClose: (action: () => void) => void) => {
            if (!account) return undefined;
            return (
                <DeleteContent
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

const DeleteAllContent: FC<{ onClose: (action: () => void) => void }> = ({ onClose }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [checked, setChecked] = useState(false);
    const { mutateAsync, isLoading } = useMutateDeleteAll();
    const client = useQueryClient();

    const onDelete = async () => {
        await mutateAsync();
        onClose(async () => {
            await client.invalidateQueries();
            navigate(AppRoute.home);
        });
    };

    return (
        <NotificationBlock>
            <TextBlock>
                <H2>{t('Delete_wallet_data')}</H2>
                <BodyText>{t('Delete_wallet_data_description')}</BodyText>
            </TextBlock>

            <DisclaimerBlock>
                <DisclaimerText>
                    <Checkbox checked={checked} onChange={setChecked} light>
                        {t('I_have_a_backup_copy_of_recovery_phrase')}
                    </Checkbox>
                </DisclaimerText>
                <DisclaimerLink
                    onClick={() =>
                        onClose(() => navigate(AppRoute.settings + SettingsRoute.recovery))
                    }
                >
                    {t('Back_up_now')}
                </DisclaimerLink>
            </DisclaimerBlock>
            <Button
                disabled={!checked}
                size="large"
                fullWidth
                loading={isLoading}
                onClick={onDelete}
                type="button"
            >
                {t('Delete_wallet_data')}
            </Button>
        </NotificationBlock>
    );
};

export const DeleteAllNotification: FC<{
    open: boolean;
    handleClose: () => void;
}> = ({ open, handleClose }) => {
    const Content = useCallback(
        (afterClose: (action: () => void) => void) => {
            if (!open) return undefined;
            return <DeleteAllContent onClose={afterClose} />;
        },
        [open]
    );

    return (
        <Notification isOpen={open} handleClose={handleClose}>
            {Content}
        </Notification>
    );
};
