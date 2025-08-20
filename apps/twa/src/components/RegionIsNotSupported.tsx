import styled from "styled-components";
import { Body1, Button, Container, H2, H3, Label1 } from "@tonkeeper/uikit";
import { DoneIcon, DownIcon, TonkeeperSvgIcon } from "@tonkeeper/uikit/dist/components/Icon";
import { useTranslation } from "react-i18next";
import { useAppSdk } from "@tonkeeper/uikit/dist/hooks/appSdk";
import { WalletEmoji } from "@tonkeeper/uikit/dist/components/shared/emoji/WalletEmoji";
import { DropDown } from "@tonkeeper/uikit/dist/components/DropDown";
import { FC, useEffect } from "react";
import { Account } from "@tonkeeper/core/dist/entries/account";
import {
  useAccountsState, useAccountsStateQuery, useActiveAccount, useActiveAccountQuery,
  useActiveTonNetwork, useMutateActiveAccount
} from "@tonkeeper/uikit/dist/state/wallet";
import { formatAddress, toShortValue } from "@tonkeeper/core/dist/utils/common";
import { ListItem, ListItemPayload } from "@tonkeeper/uikit/dist/components/List";
import { AccountAndWalletBadgesGroup } from "@tonkeeper/uikit/dist/components/account/AccountBadge";
import { ColumnText } from "@tonkeeper/uikit/dist/components/Layout";
import { hexToRGBA } from "@tonkeeper/uikit/dist/libs/css";
import { DeleteAllNotification } from "@tonkeeper/uikit/dist/components/settings/DeleteAccountNotification";
import { useDisclosure } from "@tonkeeper/uikit/dist/hooks/useDisclosure";
import { Route, Routes, useNavigate } from "react-router-dom";
import { SettingsRoute } from "@tonkeeper/uikit/dist/libs/routes";
import { ActiveRecovery } from "@tonkeeper/uikit/dist/pages/settings/Recovery";

const RegionIsNotSupportedWrapper = styled(Container)<{ $align: string }>`
    height: var(--app-height);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: ${p => p.$align};
    box-sizing: border-box;
`;

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 16px 24px;
    text-align: center;
    text-wrap: balance;
`

const TonkeeperIconBox = styled.div`
    background: ${p => p.theme.backgroundContent};
    border-radius: 26px;
    margin-bottom: 20px;
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${p => p.theme.accentBlue};
`

const Body1Styled = styled(Body1)`
    margin-top: 4px;
    color: ${p => p.theme.textSecondary};
    padding-bottom: 16px;
`

const RecoveryBlock = styled.div`
    padding: 56px 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;


    .header-dd-container {
        margin-left: -135px;
        width: 270px;
        height: fit-content;
        top: -10px;
        transform: translateY(-100%);
    }
`

const DeleteButton = styled(Button)`
    color: ${p => p.theme.accentRed};
    background-color: ${p => hexToRGBA(p.theme.accentRed, 0.16)};
`

export const RegionIsNotSupported = () => {
  return <Routes>
      <Route path={SettingsRoute.recovery} element={<ActiveRecovery />} />
      <Route path="*" element={<RegionIsNotSupportedPage />} />
  </Routes>
}

const RegionIsNotSupportedPage = () => {
  const { t } = useTranslation();
  const sdk = useAppSdk();
  const {data: account} = useActiveAccountQuery();
  const {data: accounts} = useAccountsStateQuery();
  const accountsToRecover = accounts?.filter(a => a.type === 'mnemonic');
  const canRecover = !!account && !!accountsToRecover?.length

    return (
      <>
        <RegionIsNotSupportedWrapper $align={canRecover ? 'flex-end' : 'center'}>
            <ContentWrapper>
              <TonkeeperIconBox>
                <TonkeeperSvgIcon size="68" />
              </TonkeeperIconBox>
              <H2>{t('tonkeeper_is_not_available_in_region_title')}</H2>
              <Body1Styled>{t(account ? 'tonkeeper_is_not_available_in_region_description' : 'tonkeeper_is_not_available_in_region_description_no_accs')}</Body1Styled>
              <Button size="small" onClick={() => sdk.openPage('https://tonkeeper.com')}>{t('tonkeeper_is_not_available_in_region_install_btn')}</Button>
              {canRecover && <ActionsBlock account={account} accounts={accountsToRecover} />}
            </ContentWrapper>
        </RegionIsNotSupportedWrapper>
  </>
    );
};

const ActionsBlock: FC<{accounts: Account[]; account: Account}> = ({account, accounts}) => {
  const { t } = useTranslation();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const navigate = useNavigate();
  const {mutate} = useMutateActiveAccount();

  useEffect(() => {
    if (account.type !== 'mnemonic') {
      mutate(accounts[0].id);
    }
  }, [accounts, account]);

  return <><RecoveryBlock>
      {accounts.length > 1 ?
        <DropDown
          center
          payload={onClose => (
            <DropDownPayload onClose={onClose} accounts={accounts} />
          )}
          containerClassName="header-dd-container"
        >
          <TitleStyled>
            <WalletEmoji emoji={account.emoji} />
            <TitleName>{account.name}</TitleName>

            <DownIconWrapper>
              <DownIcon />
            </DownIconWrapper>
          </TitleStyled>
        </DropDown>
        :
        <TitleStyled>
          <WalletEmoji emoji={account.emoji} />
          <TitleName>{account.name}</TitleName>
        </TitleStyled>
      }
      <Button fullWidth secondary size="large" onClick={() => navigate(SettingsRoute.recovery)}>{t('tonkeeper_is_not_available_in_region_recovery_btn')}</Button>
    </RecoveryBlock>
    <DeleteButton size="small" onClick={onOpen}>{t('tonkeeper_is_not_available_in_region_delete_btn')}</DeleteButton>
    <DeleteAllNotification open={isOpen} handleClose={onClose} />
    </>
}

const AccountRow: FC<{
  account: Account;
  onClose: () => void;
}> = ({ account, onClose }) => {
  const network = useActiveTonNetwork();
  const activeAccount = useActiveAccount();
  const {mutate} = useMutateActiveAccount();

  return (
    <ListItem
      dropDown
      onClick={() => {
        mutate(account.id);
        onClose();
      }}
    >
      <ListItemPayloadStyled>
        <WalletEmoji emoji={account.emoji} />
        {account.allTonWallets.length > 1 ?
          <>
            <Label1>{account.name}</Label1>
          </> :
          <>
            <ColumnTextStyled noWrap text={account.name} secondary={toShortValue(formatAddress(account.activeTonWallet.rawAddress, network))} />
            <AccountAndWalletBadgesGroup account={account} walletId={account.activeTonWallet.id} />
          </>
        }
        {activeAccount?.id === account.id ? (
          <Icon>
            <DoneIcon />
          </Icon>
        ) : undefined}
      </ListItemPayloadStyled>
    </ListItem>
  );
};

const DropDownPayload: FC<{ accounts: Account[]; onClose: () => void;}> = ({ onClose, accounts }) => {
  return <>{
    accounts?.map(account => (
        <AccountRow
          account={account}
          key={account.id}
          onClose={onClose}
        />
      ))
  }
  </>

};




const Title = styled(H3)`
    display: flex;
    gap: 0.5rem;
`;

const TitleStyled = styled(Title)`
    align-items: center;
`;

const TitleName = styled.span`
    display: inline-block;
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const DownIconWrapper = styled.span`
    color: ${props => props.theme.iconSecondary};
    display: flex;
    align-items: center;
`;

const Icon = styled.span`
    padding-left: 0.5rem;
    color: ${props => props.theme.accentBlue};
    display: flex;
    margin-left: auto;
`;

const Row = styled.div`
    cursor: pointer;
    display: flex;
    padding: 1rem;
    box-sizing: border-box;
    align-items: center;
    justify-content: space-between;

    background: ${props => props.theme.backgroundContentTint};

    &:hover {
        background: ${props => props.theme.backgroundHighlighted};
    }
`;

const ListItemPayloadStyled = styled(ListItemPayload)`
    justify-content: flex-start;
`;

const ColumnTextStyled = styled(ColumnText)`
    flex-grow: 0;
`;
