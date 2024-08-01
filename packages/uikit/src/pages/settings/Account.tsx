import { FC, useCallback, useMemo, useState } from 'react';
import {
    DragDropContext,
    Draggable,
    DraggableProvidedDragHandleProps,
    Droppable,
    OnDragEndResponder
} from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { InnerBody } from '../../components/Body';
import { DropDown } from '../../components/DropDown';
import { EllipsisIcon, ReorderIcon } from '../../components/Icon';
import { ColumnText, Divider } from '../../components/Layout';
import { ListBlock, ListItem, ListItemElement, ListItemPayload } from '../../components/List';
import { SkeletonListPayloadWithImage } from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { Label1 } from '../../components/Text';
import { ImportNotification } from '../../components/create/ImportNotification';
import { DeleteAccountNotification } from '../../components/settings/DeleteAccountNotification';
import { SetUpWalletIcon } from '../../components/settings/SettingsIcons';
import { SettingsList } from '../../components/settings/SettingsList';
import { RenameWalletNotification } from '../../components/settings/wallet-name/WalletNameNotification';
import { WalletEmoji } from '../../components/shared/emoji/WalletEmoji';
import { useTranslation } from '../../hooks/translation';
import { AppRoute, SettingsRoute } from '../../libs/routes';
import { useMutateAccountsState, useAccountsState } from '../../state/wallet';
import { Account as AccountType } from '@tonkeeper/core/dist/entries/account';
import { useAccountLabel } from '../../hooks/accountUtils';

const Row = styled.div`
    display: flex;
    gap: 0.5rem;
    align-items: center;

    width: 100%;
`;

const Icon = styled.span`
    display: flex;
    color: ${props => props.theme.iconSecondary};
`;

const WalletRow: FC<{
    account: AccountType;
    dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
}> = ({ account, dragHandleProps }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [rename, setRename] = useState<boolean>(false);
    const [remove, setRemove] = useState<boolean>(false);

    const secondary = useAccountLabel(account);

    if (!account) {
        return <SkeletonListPayloadWithImage />;
    }

    return (
        <>
            <ListItemPayload>
                <Row>
                    <Icon {...dragHandleProps}>
                        <ReorderIcon />
                    </Icon>
                    <WalletEmoji emoji={account.emoji} />
                    <ColumnText noWrap text={account.name} secondary={secondary} />
                    <DropDown
                        payload={onClose => (
                            <ListBlock margin={false} dropDown>
                                <ListItem
                                    dropDown
                                    onClick={() => {
                                        setRename(true);
                                        onClose();
                                    }}
                                >
                                    <ListItemPayload>
                                        <Label1>{t('Rename')}</Label1>
                                    </ListItemPayload>
                                </ListItem>
                                {account.type === 'mnemonic' && (
                                    <ListItem
                                        dropDown
                                        onClick={() => {
                                            navigate(
                                                AppRoute.settings +
                                                    SettingsRoute.recovery +
                                                    `/${account.id}`
                                            );
                                        }}
                                    >
                                        <ListItemPayload>
                                            <Label1>{t('settings_backup_seed')}</Label1>
                                        </ListItemPayload>
                                    </ListItem>
                                )}
                                <Divider />
                                <ListItem
                                    dropDown
                                    onClick={() => {
                                        setRemove(true);
                                        onClose();
                                    }}
                                >
                                    <ListItemPayload>
                                        <Label1>{t('settings_delete_account')}</Label1>
                                    </ListItemPayload>
                                </ListItem>
                            </ListBlock>
                        )}
                    >
                        <Icon>
                            <EllipsisIcon />
                        </Icon>
                    </DropDown>
                </Row>
            </ListItemPayload>
            <RenameWalletNotification
                account={rename ? account : undefined}
                handleClose={() => setRename(false)}
            />
            <DeleteAccountNotification
                account={remove ? account : undefined}
                handleClose={() => setRemove(false)}
            />
        </>
    );
};

export const Account = () => {
    const [isOpen, setOpen] = useState(false);
    const { t } = useTranslation();

    const accounts = useAccountsState();
    const { mutate } = useMutateAccountsState();

    const createItems = useMemo(() => {
        return [
            {
                name: t('balances_setup_wallet'),
                icon: <SetUpWalletIcon />,
                action: () => setOpen(true)
            }
        ];
    }, []);

    const handleDrop: OnDragEndResponder = useCallback(
        droppedItem => {
            if (!droppedItem.destination) return;
            const updatedList = [...accounts];
            const [reorderedItem] = updatedList.splice(droppedItem.source.index, 1);
            updatedList.splice(droppedItem.destination.index, 0, reorderedItem);
            mutate(updatedList);
        },
        [accounts, mutate]
    );

    return (
        <>
            <SubHeader title={t('Manage_wallets')} />
            <InnerBody>
                <DragDropContext onDragEnd={handleDrop}>
                    <Droppable droppableId="wallets">
                        {provided => (
                            <ListBlock {...provided.droppableProps} ref={provided.innerRef}>
                                {accounts.map((account, index) => (
                                    <Draggable
                                        key={account.id}
                                        draggableId={account.id}
                                        index={index}
                                    >
                                        {p => (
                                            <ListItemElement
                                                ios={true}
                                                hover={false}
                                                ref={p.innerRef}
                                                {...p.draggableProps}
                                            >
                                                <WalletRow
                                                    dragHandleProps={p.dragHandleProps}
                                                    account={account}
                                                />
                                            </ListItemElement>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </ListBlock>
                        )}
                    </Droppable>
                </DragDropContext>

                <SettingsList items={createItems} />
            </InnerBody>

            <ImportNotification isOpen={isOpen} setOpen={setOpen} />
        </>
    );
};
