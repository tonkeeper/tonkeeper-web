import {
    backwardCompatibilityOnlyWalletVersions,
    WalletVersion as WalletVersionType,
    WalletVersions,
    walletVersionText
} from '@tonkeeper/core/dist/entries/wallet';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { AccountId, AccountVersionEditable } from '@tonkeeper/core/dist/entries/account';
import React, { FC } from 'react';
import styled from 'styled-components';
import { InnerBody } from '../../components/Body';
import { SubHeader } from '../../components/SubHeader';
import { Body2, Label1 } from '../../components/Text';
import { useTranslation } from '../../hooks/translation';
import {
    useStandardTonWalletVersions,
    useActiveAccount,
    useMutateActiveTonWallet,
    useRemoveTonWalletVersionFromAccount,
    useAddTonWalletVersionToAccount,
    useAccountState
} from '../../state/wallet';
import { ListBlock, ListItem, ListItemPayload } from '../../components/List';
import { toFormattedTonBalance } from '../../hooks/balance';
import { Button } from '../../components/fields/Button';
import { Address } from '@ton/core';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../../libs/routes';
import { SkeletonList } from '../../components/Skeleton';

const LedgerError = styled(Body2)`
    margin: 0.5rem 0;
    color: ${p => p.theme.accentRed};
`;

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
}> = ({ afterWalletOpened, accountId }) => {
    const { t } = useTranslation();
    const activeAccount = useActiveAccount();
    const passedAccount = useAccountState(accountId);
    const selectedAccount = passedAccount ?? activeAccount;

    if (selectedAccount.type === 'ledger') {
        return <LedgerError>{t('ledger_operation_not_supported')}</LedgerError>;
    }

    if (selectedAccount.type === 'keystone' || selectedAccount.type === 'watch-only') {
        return <LedgerError>{t('operation_not_supported')}</LedgerError>;
    }

    return (
        <WalletVersionPageContentInternal
            afterWalletOpened={afterWalletOpened}
            account={selectedAccount}
        />
    );
};

export const WalletVersionPageContentInternal: FC<{
    afterWalletOpened?: () => void;
    account: AccountVersionEditable;
}> = ({ afterWalletOpened, account }) => {
    const { t } = useTranslation();
    const activeAccount = useActiveAccount();
    const appActiveWallet = activeAccount.activeTonWallet;
    const selectedWallet = account.activeTonWallet;
    const currentAccountWalletsVersions = account.allTonWallets;

    const { mutateAsync: selectWallet, isLoading: isSelectWalletLoading } =
        useMutateActiveTonWallet();
    const navigate = useNavigate();

    const { data: wallets } = useStandardTonWalletVersions(selectedWallet.publicKey);

    const { mutate: createWallet, isLoading: isCreateWalletLoading } =
        useAddTonWalletVersionToAccount();

    const { mutate: hideWallet, isLoading: isHideWalletLoading } =
        useRemoveTonWalletVersionFromAccount();

    const onOpenWallet = async (address: Address) => {
        if (address.toRawString() !== appActiveWallet.rawAddress) {
            await selectWallet(address.toRawString());
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

    const onHideWallet = async (w: { address: Address }) => {
        hideWallet({
            accountId: account.id,
            walletId: w.address.toRawString()
        });
    };

    if (!wallets) {
        return <SkeletonList size={WalletVersions.length} />;
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
        <ListBlock>
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
                                    {toShortValue(formatAddress(wallet.address)) + ' '}·
                                    {' ' + toFormattedTonBalance(wallet.tonBalance)}
                                    &nbsp;TON
                                    {wallet.hasJettons && t('wallet_version_and_tokens')}
                                </Body2Secondary>
                            </TextContainer>
                            {isWalletAdded ? (
                                <ButtonsContainer>
                                    <Button
                                        onClick={() => onOpenWallet(wallet.address)}
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
        </ListBlock>
    );
};
