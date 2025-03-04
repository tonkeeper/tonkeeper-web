import { FC, useMemo, useState } from 'react';
import {
    DragDropContext,
    Draggable,
    DraggableProvidedDragHandleProps,
    Droppable
} from 'react-beautiful-dnd';
import styled from 'styled-components';
import { InnerBody } from '../../components/Body';
import { DropDown } from '../../components/DropDown';
import { EllipsisIcon, ReorderIcon } from '../../components/Icon';
import { ColumnText, Divider } from '../../components/Layout';
import { ListBlock, ListItem, ListItemElement, ListItemPayload } from '../../components/List';
import { SkeletonListPayloadWithImage } from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { Label1 } from '../../components/Text';
import { DeleteAccountNotification } from '../../components/settings/DeleteAccountNotification';
import { SetUpWalletIcon } from '../../components/settings/SettingsIcons';
import { SettingsList } from '../../components/settings/SettingsList';
import { RenameWalletNotification } from '../../components/settings/wallet-name/WalletNameNotification';
import { WalletEmoji } from '../../components/shared/emoji/WalletEmoji';
import { useTranslation } from '../../hooks/translation';
import { AppRoute, SettingsRoute } from '../../libs/routes';
import { Account as AccountType } from '@tonkeeper/core/dist/entries/account';
import { useAccountLabel } from '../../hooks/accountUtils';
import { useAddWalletNotification } from '../../components/modals/AddWalletNotificationControlled';

import { useAccountsDNDDrop, useSideBarItems } from '../../state/folders';
import { useNavigate } from '../../hooks/router/useNavigate';

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

const IconMock = styled.div`
    height: 28px;
    width: 28px;
`;

const WalletRow: FC<{
    account: AccountType;
    dragHandleProps?: DraggableProvidedDragHandleProps | null | undefined;
}> = ({ account, dragHandleProps }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [rename, setRename] = useState<boolean>(false);
    const [remove, setRemove] = useState<boolean>(false);

    const secondary = useAccountLabel(account);

    if (account.type === 'ton-multisig') {
        return null;
    }

    if (!account) {
        return <SkeletonListPayloadWithImage />;
    }

    return (
        <>
            <ListItemPayload>
                <Row>
                    {dragHandleProps ? (
                        <Icon {...dragHandleProps}>
                            <ReorderIcon />
                        </Icon>
                    ) : (
                        <IconMock />
                    )}
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

const ListItemElementStyled = styled(ListItemElement)`
    & > div {
        border-top: 1px solid ${props => props.theme.separatorCommon};
        padding-top: 15px;
    }
`;

const ListItemElementInGroup = styled(ListItemElement)`
    & > div {
        border-top: none !important;
        padding-top: 15px;
    }
`;

const ListBlockStyled = styled(ListBlock)`
    overflow: hidden;
    & > *:nth-child(3) > div {
        border-top: none !important;

        > div {
            border-top: none !important;
        }
    }
`;

export const Account = () => {
    const { onOpen: addWallet } = useAddWalletNotification();
    const { t } = useTranslation();

    const items = useSideBarItems();
    const { handleDrop, itemsOptimistic } = useAccountsDNDDrop(items);

    const createItems = useMemo(() => {
        return [
            {
                name: t('balances_setup_wallet'),
                icon: <SetUpWalletIcon />,
                action: () => addWallet()
            }
        ];
    }, []);

    return (
        <>
            <SubHeader title={t('Manage_wallets')} />
            <InnerBody>
                <DragDropContext onDragEnd={handleDrop}>
                    <Droppable droppableId="wallets">
                        {provided => (
                            <ListBlockStyled {...provided.droppableProps} ref={provided.innerRef}>
                                {itemsOptimistic.map((account, index) => {
                                    if (account.type === 'folder') {
                                        return (
                                            <Draggable
                                                key={account.id}
                                                draggableId={account.id}
                                                index={index}
                                            >
                                                {p => (
                                                    <div ref={p.innerRef} {...p.draggableProps}>
                                                        {account.accounts.map((a, i) => {
                                                            if (i === 0) {
                                                                return (
                                                                    <ListItemElementStyled
                                                                        ios={true}
                                                                        hover={false}
                                                                        key={account.id}
                                                                    >
                                                                        <WalletRow
                                                                            key={a.id}
                                                                            account={a}
                                                                            dragHandleProps={
                                                                                p.dragHandleProps
                                                                            }
                                                                        />
                                                                    </ListItemElementStyled>
                                                                );
                                                            }
                                                            return (
                                                                <ListItemElementInGroup
                                                                    ios={true}
                                                                    hover={false}
                                                                    key={account.id}
                                                                >
                                                                    <WalletRow
                                                                        key={a.id}
                                                                        account={a}
                                                                    />
                                                                </ListItemElementInGroup>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    }

                                    return (
                                        <Draggable
                                            key={account.id}
                                            draggableId={account.id}
                                            index={index}
                                        >
                                            {p => (
                                                <ListItemElementStyled
                                                    ios={true}
                                                    hover={false}
                                                    ref={p.innerRef}
                                                    {...p.draggableProps}
                                                >
                                                    <WalletRow
                                                        dragHandleProps={p.dragHandleProps}
                                                        account={account}
                                                    />
                                                </ListItemElementStyled>
                                            )}
                                        </Draggable>
                                    );
                                })}
                                {provided.placeholder}
                            </ListBlockStyled>
                        )}
                    </Droppable>
                </DragDropContext>

                <SettingsList items={createItems} />
            </InnerBody>
        </>
    );
};
