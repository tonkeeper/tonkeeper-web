import { FC, useMemo, useState } from 'react';
import React from 'react';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
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

import { AccountsFolder, useAccountsDNDDrop, useSideBarItems } from '../../state/folders';
import { useNavigate } from '../../hooks/router/useNavigate';
import { useAppSdk } from '../../hooks/appSdk';

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

type DragHandleProps = React.HTMLAttributes<HTMLElement> | undefined;

const WalletRow: FC<{
    account: AccountType;
    dragHandleProps?: DragHandleProps;
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
    & > *:first-child > div {
        border-top: none !important;

        > div {
            border-top: none !important;
        }
    }
`;

const SortableItem: FC<{ account: AccountType | AccountsFolder }> = ({ account }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: account.id
    });
    const style: React.CSSProperties = {
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
        transition
    };

    if (account.type === 'folder') {
        return (
            <div ref={setNodeRef} style={style} {...attributes}>
                {account.accounts.map((a, i) => {
                    if (i === 0) {
                        return (
                            <ListItemElementStyled ios={true} hover={false} key={a.id}>
                                <WalletRow
                                    account={a}
                                    dragHandleProps={listeners as DragHandleProps}
                                />
                            </ListItemElementStyled>
                        );
                    }
                    return (
                        <ListItemElementInGroup ios={true} hover={false} key={a.id}>
                            <WalletRow account={a} />
                        </ListItemElementInGroup>
                    );
                })}
            </div>
        );
    }

    return (
        <ListItemElementStyled
            ios={true}
            hover={false}
            ref={setNodeRef}
            style={style}
            {...attributes}
        >
            <WalletRow dragHandleProps={listeners as DragHandleProps} account={account} />
        </ListItemElementStyled>
    );
};

export const Account = () => {
    const { onOpen: addWallet } = useAddWalletNotification();
    const { t } = useTranslation();
    const sdk = useAppSdk();

    const items = useSideBarItems();
    const { handleSidebarDrop, itemsOptimistic } = useAccountsDNDDrop(items);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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
                <DndContext
                    sensors={sensors}
                    onDragEnd={handleSidebarDrop}
                    onDragStart={() => sdk.hapticNotification('impact_medium')}
                    modifiers={[restrictToVerticalAxis]}
                >
                    <SortableContext
                        items={itemsOptimistic.map(i => i.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <ListBlockStyled>
                            {itemsOptimistic.map(account => (
                                <SortableItem key={account.id} account={account} />
                            ))}
                        </ListBlockStyled>
                    </SortableContext>
                </DndContext>

                <SettingsList items={createItems} />
            </InnerBody>
        </>
    );
};
