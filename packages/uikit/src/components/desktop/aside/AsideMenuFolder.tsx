import { FC } from 'react';
import { AccountsFolder } from '../../../state/global-preferences';
import { Label2 } from '../../Text';
import { AsideMenuItem } from '../../shared/AsideItem';
import { FolderIcon, GearIconEmpty } from '../../Icon';
import { styled } from 'styled-components';
import { IconButtonTransparentBackground } from '../../fields/IconButton';
import { useIsHovered } from '../../../hooks/useIsHovered';
import { useManageFolderNotification } from '../../modals/ManageFolderNotificationControlled';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { Accordion } from '../../shared/Accordion';
import { AsideMenuAccount } from './AsideMenuAccount';
import { useAccountsState } from '../../../state/wallet';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { useSetFolderLastIsOpened } from '../../../state/folders';

const FolderIconStyled = styled(FolderIcon)`
    color: ${p => p.theme.iconSecondary};
`;

const GearIconButtonStyled = styled(IconButtonTransparentBackground)<{ isShown: boolean }>`
    margin-left: auto;
    margin-right: -10px;
    flex-shrink: 0;
    padding-left: 0;

    opacity: ${p => (p.isShown ? 1 : 0)};
    transition: opacity 0.15s ease-in-out;
`;

const AsideMenuSubItemContainer = styled.div`
    padding-left: 22px;
    box-sizing: border-box;
`;

export const AsideMenuFolder: FC<{
    folder: AccountsFolder;
    onClickWallet: (walletId: WalletId) => void;
}> = ({ folder, onClickWallet }) => {
    const { isHovered, ref } = useIsHovered<HTMLDivElement>();
    const { onOpen: onManageFolder } = useManageFolderNotification();
    const { isOpen, onToggle } = useDisclosure(folder.lastIsOpened);
    const accounts = useAccountsState();
    const { mutate, reset } = useSetFolderLastIsOpened();

    const onClickFolder = () => {
        reset();
        mutate({ id: folder.id, lastIsOpened: !isOpen });
        onToggle();
    };

    return (
        <>
            <AsideMenuItem isSelected={false} onClick={onClickFolder} ref={ref}>
                <FolderIconStyled />
                <Label2>{folder.name}</Label2>
                <GearIconButtonStyled
                    onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        onManageFolder({ folderId: folder.id });
                    }}
                    isShown={isHovered}
                >
                    <GearIconEmpty />
                </GearIconButtonStyled>
            </AsideMenuItem>
            <AsideMenuSubItemContainer>
                <Accordion isOpened={isOpen} transitionMS={250}>
                    {folder.accounts.map(account => (
                        <AsideMenuAccount
                            key={account}
                            account={accounts.find(a => a.id === account)!}
                            isSelected={false}
                            onClickWallet={onClickWallet}
                        />
                    ))}
                </Accordion>
            </AsideMenuSubItemContainer>
        </>
    );
};
