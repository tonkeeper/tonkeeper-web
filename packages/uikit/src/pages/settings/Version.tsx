import {
    backwardCompatibilityOnlyWalletVersions,
    WalletVersion as WalletVersionType,
    WalletVersions,
    walletVersionText,
    WalletId
} from '@tonkeeper/core/dist/entries/wallet';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import {
    AccountId,
    AccountVersionEditable,
    getNetworkByAccount
} from '@tonkeeper/core/dist/entries/account';
import { FC } from 'react';
import styled from 'styled-components';
import { InnerBody } from '../../components/Body';
import { SubHeader } from '../../components/SubHeader';
import { Body2, Label1, Label2 } from '../../components/Text';
import { useTranslation } from '../../hooks/translation';
import {
    useStandardTonWalletVersions,
    useActiveAccount,
    useMutateActiveTonWallet,
    useRemoveTonWalletVersionFromAccount,
    useAddTonWalletVersionToAccount,
    useAccountState
} from '../../state/wallet';
import { ListBlockDesktopAdaptive, ListItem, ListItemPayload } from '../../components/List';
import { toFormattedTonBalance } from '../../hooks/balance';
import { Button } from '../../components/fields/Button';
import { Address } from '@ton/core';
import { AppRoute } from '../../libs/routes';
import { SkeletonListDesktopAdaptive } from '../../components/Skeleton';
import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { Navigate } from '../../components/shared/Navigate';
import { useNavigate } from "../../hooks/router/useNavigate";

const TextContainer = styled.span`
    flex-direction: column;
    display: flex;
    align-items: flex-start;
`;

const Body2Secondary = styled(Body2)`
    color: ${props => props.theme.textSecondary};
`;

const ButtonsContainer = styled.div`
    display: flex;
    gap: 8px;
`;

export const WalletVersionPage = () => {
    const { t } = useTranslation();
    const isFullWidth = useIsFullWidthMode();

    if (isFullWidth) {
        return (
            <DesktopViewPageLayout>
                <DesktopViewHeader backButton>
                    <Label2>{t('settings_wallet_version')}</Label2>
                </DesktopViewHeader>
                <WalletVersionPageContent />
            </DesktopViewPageLayout>
        );
    }

    return (
        <>
            <SubHeader title={t('settings_wallet_version')} />
            <InnerBody>
                <WalletVersionPageContent />
            </InnerBody>
        </>
    );
};

export const WalletVersionPageContent: FC<{
    afterWalletOpened?: () => void;
    accountId?: AccountId;
    className?: string;
}> = ({ afterWalletOpened, accountId, className }) => {
    const activeAccount = useActiveAccount();
    const passedAccount = useAccountState(accountId);
    const selectedAccount = passedAccount ?? activeAccount;

    if (
        selectedAccount.type === 'ledger' ||
        selectedAccount.type === 'keystone' ||
        selectedAccount.type === 'watch-only' ||
        selectedAccount.type === 'mam' ||
        selectedAccount.type === 'ton-multisig'
    ) {
        return <Navigate to="../" />;
    }

    return (
        <WalletVersionPageContentInternal
            afterWalletOpened={afterWalletOpened}
            account={selectedAccount}
            className={className}
        />
    );
};

export const WalletVersionPageContentInternal: FC<{
    afterWalletOpened?: () => void;
    account: AccountVersionEditable;
    className?: string;
}> = ({ afterWalletOpened, account, className }) => {
    const { t } = useTranslation();
    const activeAccount = useActiveAccount();
    const appActiveWallet = activeAccount.activeTonWallet;

    const selectedWallet = account.activeTonWallet;
    const currentAccountWalletsVersions = account.allTonWallets;
    const network = getNetworkByAccount(account);

    const { mutateAsync: selectWallet, isLoading: isSelectWalletLoading } =
        useMutateActiveTonWallet();
    const navigate = useNavigate();

    const { data: wallets } = useStandardTonWalletVersions(network, selectedWallet.publicKey);

    const { mutate: createWallet, isLoading: isCreateWalletLoading } =
        useAddTonWalletVersionToAccount();

    const { mutate: hideWallet, isLoading: isHideWalletLoading } =
        useRemoveTonWalletVersionFromAccount();

    const onOpenWallet = async (w: { id: WalletId; address: Address }) => {
        if (w.id !== appActiveWallet.id) {
            await selectWallet(w.id);
        }
        navigate(AppRoute.home);
        afterWalletOpened?.();
    };

    const onAddWallet = async (w: { version: WalletVersionType; address: Address }) => {
        createWallet({
            accountId: account.id,
            version: w.version
        });
    };

    const onHideWallet = async (w: { id: WalletId; address: Address }) => {
        hideWallet({
            accountId: account.id,
            walletId: w.id
        });
    };
    if (!wallets) {
        return <SkeletonListDesktopAdaptive className={className} size={WalletVersions.length} />;
    }

    const isLoading = isSelectWalletLoading || isCreateWalletLoading || isHideWalletLoading;
    const canHide = currentAccountWalletsVersions.length > 1;

    const walletsToShow = wallets.filter(
        w =>
            !backwardCompatibilityOnlyWalletVersions.includes(w.version) ||
            currentAccountWalletsVersions.some(item => item.version === w.version) ||
            w.tonBalance ||
            w.hasJettons
    );

    return (
        <ListBlockDesktopAdaptive className={className}>
            {walletsToShow.map(wallet => {
                const isWalletAdded = currentAccountWalletsVersions.some(
                    w => w.rawAddress === wallet.address.toRawString()
                );

                return (
                    <ListItem hover={false} key={wallet.address.toRawString()}>
                        <ListItemPayload>
                            <TextContainer>
                                <Label1>{walletVersionText(wallet.version)}</Label1>
                                <Body2Secondary>
                                    {toShortValue(formatAddress(wallet.address, network)) + ' '}·
                                    {' ' + toFormattedTonBalance(wallet.tonBalance)}
                                    &nbsp;TON
                                    {wallet.hasJettons && t('wallet_version_and_tokens')}
                                </Body2Secondary>
                            </TextContainer>
                            {isWalletAdded ? (
                                <ButtonsContainer>
                                    <Button
                                        onClick={() => onOpenWallet(wallet)}
                                        loading={isLoading}
                                    >
                                        {t('open')}
                                    </Button>
                                    {canHide && (
                                        <Button
                                            onClick={() => onHideWallet(wallet)}
                                            loading={isLoading}
                                        >
                                            {t('hide')}
                                        </Button>
                                    )}
                                </ButtonsContainer>
                            ) : (
                                <Button
                                    primary
                                    onClick={() => onAddWallet(wallet)}
                                    loading={isLoading}
                                >
                                    {t('add')}
                                </Button>
                            )}
                        </ListItemPayload>
                    </ListItem>
                );
            })}
        </ListBlockDesktopAdaptive>
    );
};
