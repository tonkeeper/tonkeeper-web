import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
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
import {
    DeleteWalletNotification,
    LogOutWalletNotification
} from '../../components/settings/LogOutNotification';
import { SetUpWalletIcon } from '../../components/settings/SettingsIcons';
import { SettingsList } from '../../components/settings/SettingsList';
import { RenameWalletNotification } from '../../components/settings/wallet-name/WalletNameNotification';
import { WalletEmoji } from '../../components/shared/emoji/WalletEmoji';
import { useTranslation } from '../../hooks/translation';
import { AppRoute, SettingsRoute } from '../../libs/routes';
import { useMutateWalletsState, useWalletsState } from '../../state/wallet';
import { isMnemonicAuthWallet, WalletState } from '@tonkeeper/core/dist/entries/wallet';

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
    wallet: WalletState;
    dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
}> = ({ wallet, dragHandleProps }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [rename, setRename] = useState<boolean>(false);
    const [logout, setLogout] = useState<boolean>(false);
    const [remove, setRemove] = useState<boolean>(false);

    if (!wallet) {
        return <SkeletonListPayloadWithImage />;
    }

    const address = formatAddress(wallet.rawAddress, wallet.network);

    return (
        <>
            <ListItemPayload>
                <Row>
                    <Icon {...dragHandleProps}>
                        <ReorderIcon />
                    </Icon>
                    <WalletEmoji emoji={wallet.emoji} />
                    <ColumnText
                        noWrap
                        text={wallet.name ? wallet.name : t('wallet_title')}
                        secondary={toShortValue(address)}
                    />
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
                                {isMnemonicAuthWallet(wallet) && (
                                    <ListItem
                                        dropDown
                                        onClick={() => {
                                            navigate(
                                                AppRoute.settings +
                                                    SettingsRoute.recovery +
                                                    `/${wallet.id}`
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
                                        setLogout(true);
                                        onClose();
                                    }}
                                >
                                    <ListItemPayload>
                                        <Label1>{t('settings_reset')}</Label1>
                                    </ListItemPayload>
                                </ListItem>
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
                wallet={rename ? wallet : undefined}
                handleClose={() => setRename(false)}
            />
            <LogOutWalletNotification
                wallet={logout ? wallet : undefined}
                handleClose={() => setLogout(false)}
            />
            <DeleteWalletNotification
                wallet={remove ? wallet : undefined}
                handleClose={() => setRemove(false)}
            />
        </>
    );
};

export const Account = () => {
    const [isOpen, setOpen] = useState(false);
    const { t } = useTranslation();

    const wallets = useWalletsState();
    const { mutate } = useMutateWalletsState();

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
            const updatedList = [...wallets];
            const [reorderedItem] = updatedList.splice(droppedItem.source.index, 1);
            updatedList.splice(droppedItem.destination.index, 0, reorderedItem);
            mutate(updatedList);
        },
        [wallets, mutate]
    );

    return (
        <>
            <SubHeader title={t('Manage_wallets')} />
            <InnerBody>
                <DragDropContext onDragEnd={handleDrop}>
                    <Droppable droppableId="wallets">
                        {provided => (
                            <ListBlock {...provided.droppableProps} ref={provided.innerRef}>
                                {wallets.map((wallet, index) => (
                                    <Draggable
                                        key={wallet.id}
                                        draggableId={wallet.id}
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
                                                    wallet={wallet}
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
