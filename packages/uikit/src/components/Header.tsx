import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { FC, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle, css } from 'styled-components';
import { useTranslation } from '../hooks/translation';
import { AppRoute, SettingsRoute } from '../libs/routes';
import { useUserCountry } from '../state/country';
import {
    useActiveWallet,
    useAccountsState,
    useMutateActiveTonWallet,
    useActiveTonNetwork,
    useActiveAccount
} from '../state/wallet';
import { DropDown } from './DropDown';
import { DoneIcon, DownIcon, PlusIcon, SettingsIcon } from './Icon';
import { ColumnText, Divider } from './Layout';
import { ListItem, ListItemPayload } from './List';
import { H1, H3, Label1, Label2 } from './Text';
import { ScanButton } from './connect/ScanButton';
import { ImportNotification } from './create/ImportNotification';
import { SkeletonText } from './shared/Skeleton';
import { WalletEmoji } from './shared/emoji/WalletEmoji';
import {
    sortDerivationsByIndex,
    sortWalletsByVersion,
    TonContract
} from '@tonkeeper/core/dist/entries/wallet';
import { Account, isAccountControllable } from '@tonkeeper/core/dist/entries/account';
import { AccountAndWalletBadgesGroup } from './account/AccountBadge';

const Block = styled.div<{
    center?: boolean;
    second?: boolean;
}>`
    flex-shrink: 0;

    user-select: none;

    overflow: visible !important;
    top: 0;
    z-index: 4;

    ${p =>
        p.theme.displayType === 'full-width'
            ? css`
                  position: absolute;
                  width: 100%;
              `
            : css`
                  position: fixed;
                  width: var(--app-width);
                  max-width: 548px;
              `}

    ${props =>
        css`
            padding: ${props.second ? '12px 1rem 0.75rem' : '16px 1rem 1rem'};
        `}

    display: flex;
    box-sizing: border-box;

    ${props =>
        props.center &&
        css`
            justify-content: center;
        `}

    background-color: ${props => props.theme.backgroundPage};
`;

export const HeaderGlobalStyle = createGlobalStyle`
  body:not(.top) ${Block} {
    &:after {
      content: '';
      display: block;
      width: 100%;
      height: 1px;
      background: ${props => props.theme.separatorCommon};
      position: absolute;
      top: 100%;
      left: 0;
    }
  }
`;

const Title = styled(H3)`
    display: flex;
    gap: 0.5rem;
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

const DropDownContainerStyle = createGlobalStyle`
  .header-dd-container {
    margin-left: -135px;
    width: 270px;
  }
`;

const WalletRow: FC<{
    account: Account;
    wallet: TonContract;
    onClose: () => void;
}> = ({ account, wallet, onClose }) => {
    const network = useActiveTonNetwork();
    const { mutate } = useMutateActiveTonWallet();
    const address = toShortValue(formatAddress(wallet.rawAddress, network));
    const activeWallet = useActiveWallet();
    return (
        <ListItem
            dropDown
            onClick={() => {
                mutate(wallet.id);
                onClose();
            }}
        >
            <ListItemPayloadStyled>
                <WalletEmoji emoji={account.emoji} />
                <ColumnTextStyled noWrap text={account.name} secondary={address} />
                <AccountAndWalletBadgesGroup account={account} walletId={wallet.id} />
                {activeWallet?.id === wallet.id ? (
                    <Icon>
                        <DoneIcon />
                    </Icon>
                ) : undefined}
            </ListItemPayloadStyled>
        </ListItem>
    );
};

const DropDownPayload: FC<{ onClose: () => void; onCreate: () => void }> = ({
    onClose,
    onCreate
}) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const accountsWallets: { wallet: TonContract; account: Account }[] = useAccountsState().flatMap(
        a => {
            if (a.type === 'ledger') {
                return a.derivations
                    .slice()
                    .sort(sortDerivationsByIndex)
                    .map(
                        d =>
                            ({
                                wallet: d.tonWallets.find(w => w.id === d.activeTonWalletId)!,
                                account: a
                            } as { wallet: TonContract; account: Account })
                    );
            }

            if (!isAccountControllable(a)) {
                return [
                    {
                        wallet: a.activeTonWallet,
                        account: a
                    }
                ];
            }

            return a.allTonWallets
                .slice()
                .sort(sortWalletsByVersion)
                .map(w => ({
                    wallet: w,
                    account: a
                }));
        }
    );

    if (!accountsWallets) {
        return null;
    }

    if (accountsWallets.length === 1) {
        return (
            <Row
                onClick={() => {
                    onClose();
                    onCreate();
                }}
            >
                <Label1>{t('balances_setup_wallet')}</Label1>
                <Icon>
                    <PlusIcon />
                </Icon>
            </Row>
        );
    } else {
        return (
            <>
                {accountsWallets.map(({ wallet, account }) => (
                    <WalletRow
                        account={account}
                        key={wallet.id}
                        wallet={wallet}
                        onClose={onClose}
                    />
                ))}
                <Divider />
                <Row
                    onClick={() => {
                        onClose();
                        navigate(AppRoute.settings + SettingsRoute.account);
                    }}
                >
                    <Label1>{t('Manage')}</Label1>
                    <Icon>
                        <SettingsIcon />
                    </Icon>
                </Row>
            </>
        );
    }
};

const TitleStyled = styled(Title)`
    align-items: center;
`;

export const Header: FC<{ showQrScan?: boolean }> = ({ showQrScan = true }) => {
    const account = useActiveAccount();
    const [isOpen, setOpen] = useState(false);

    const accounts = useAccountsState();
    const shouldShowIcon = accounts.length > 1;

    return (
        <Block center>
            <DropDownContainerStyle />
            <DropDown
                center
                payload={onClose => (
                    <DropDownPayload onClose={onClose} onCreate={() => setOpen(true)} />
                )}
                containerClassName="header-dd-container"
            >
                <TitleStyled>
                    {shouldShowIcon && <WalletEmoji emoji={account.emoji} />}
                    <TitleName>{account.name}</TitleName>

                    <DownIconWrapper>
                        <DownIcon />
                    </DownIconWrapper>
                </TitleStyled>
            </DropDown>

            {showQrScan && <ScanButton />}

            <ImportNotification isOpen={isOpen} setOpen={setOpen} />
        </Block>
    );
};

export const ActivityHeader = () => {
    const { t } = useTranslation();

    return (
        <Block second>
            <H1>{t('activity_screen_title')}</H1>
        </Block>
    );
};

export const PurchasesHeader = () => {
    const { t } = useTranslation();

    return (
        <Block second>
            <H1>{t('purchases_screen_title')}</H1>
        </Block>
    );
};

export const TokensHeader = () => {
    const { t } = useTranslation();

    return (
        <Block second>
            <H1>{t('jettons_list_title')}</H1>
        </Block>
    );
};

export const SettingsHeader = () => {
    const { t } = useTranslation();

    return (
        <Block second>
            <H1>{t('settings_title')}</H1>
        </Block>
    );
};

const SkeletonCountry = styled(SkeletonText)`
    position: absolute;
    right: 16px;
    top: 24px;
`;

const CountryButton = styled.button`
    position: absolute;
    right: 16px;
    top: 16px;
    color: ${props => props.theme.buttonSecondaryForeground};
    background: ${props => props.theme.buttonSecondaryBackground};
    border-radius: ${props => props.theme.cornerSmall};
    border: none;
    padding: 6px 12px;
    cursor: pointer;

    &:hover {
        background-color: ${props => props.theme.backgroundContentTint};
    }

    transition: background-color 0.1s ease;
`;

export const BrowserHeader = () => {
    const { t } = useTranslation();
    const { data: country, isLoading: isCountryLoading } = useUserCountry();

    return (
        <Block second>
            <H1>{t('browser_title')}</H1>
            {isCountryLoading ? (
                <SkeletonCountry width="50px" size="large" />
            ) : (
                <Link to={AppRoute.settings + SettingsRoute.country}>
                    <CountryButton>
                        <Label2>{country || '🌎'}</Label2>
                    </CountryButton>
                </Link>
            )}
        </Block>
    );
};
