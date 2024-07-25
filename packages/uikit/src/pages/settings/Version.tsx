import {
    WalletVersion as WalletVersionType,
    WalletVersions,
    walletVersionText
} from '@tonkeeper/core/dist/entries/wallet';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import styled from 'styled-components';
import { InnerBody } from '../../components/Body';
import { SubHeader } from '../../components/SubHeader';
import { Body2, Label1 } from '../../components/Text';
import { useTranslation } from '../../hooks/translation';
import { useIsActiveWalletKeystone } from '../../state/keystone';
import { useIsActiveWalletLedger } from '../../state/ledger';
import {
    useActiveStandardTonWallet,
    useStandardTonWalletVersions,
    useActiveAccount,
    useAddTonWalletVersionToActiveAccount,
    useMutateActiveTonWallet,
    useRemoveTonWalletVersionFromActiveAccount
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

export const WalletVersionPageContent: FC<{ afterWalletOpened?: () => void }> = ({
    afterWalletOpened
}) => {
    const { t } = useTranslation();
    const isLedger = useIsActiveWalletLedger();
    const isKeystone = useIsActiveWalletKeystone();
    const currentWallet = useActiveStandardTonWallet();
    const currentAccount = useActiveAccount();
    const currentAccountWalletsVersions = currentAccount.activeDerivationTonWallets;

    const { mutateAsync: selectWallet, isLoading: isSelectWalletLoading } =
        useMutateActiveTonWallet();
    const navigate = useNavigate();

    const { data: wallets } = useStandardTonWalletVersions(currentWallet.publicKey);

    const { mutate: createWallet, isLoading: isCreateWalletLoading } =
        useAddTonWalletVersionToActiveAccount();

    const { mutate: hideWallet, isLoading: isHideWalletLoading } =
        useRemoveTonWalletVersionFromActiveAccount();

    const onOpenWallet = async (address: Address) => {
        if (address.toRawString() !== currentWallet.rawAddress) {
            await selectWallet(address.toRawString());
        }
        navigate(AppRoute.home);
        afterWalletOpened?.();
    };

    const onAddWallet = async (w: { version: WalletVersionType; address: Address }) => {
        createWallet({
            version: w.version
        });
    };

    const onHideWallet = async (w: { address: Address }) => {
        hideWallet({
            walletId: w.address.toRawString()
        });
    };

    if (!wallets) {
        return <SkeletonList size={WalletVersions.length} />;
    }

    const isLoading = isSelectWalletLoading || isCreateWalletLoading || isHideWalletLoading;

    return (
        <>
            {!isLedger && !isKeystone && (
                <ListBlock>
                    {wallets.map(wallet => {
                        const isWalletAdded = currentAccountWalletsVersions.some(
                            w => w.rawAddress === wallet.address.toRawString()
                        );

                        return (
                            <ListItem hover={false} key={wallet.address.toRawString()}>
                                <ListItemPayload>
                                    <TextContainer>
                                        <Label1>{walletVersionText(wallet.version)}</Label1>
                                        <Body2Secondary>
                                            {toShortValue(formatAddress(wallet.address))}
                                            &nbsp;·&nbsp;
                                            {toFormattedTonBalance(wallet.tonBalance)}&nbsp;TON
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
                                            <Button
                                                onClick={() => onHideWallet(wallet)}
                                                loading={isLoading}
                                            >
                                                {t('hide')}
                                            </Button>
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
            )}
            {isLedger && <LedgerError>{t('ledger_operation_not_supported')}</LedgerError>}
            {isKeystone && <LedgerError>{t('operation_not_supported')}</LedgerError>}
        </>
    );
};
