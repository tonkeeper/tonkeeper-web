import { AccountLedger } from '@tonkeeper/core/dist/entries/account';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import styled from 'styled-components';
import { InnerBody } from '../../components/Body';
import { SubHeader } from '../../components/SubHeader';
import { Body2, Label1 } from '../../components/Text';
import { useTranslation } from '../../hooks/translation';
import {
    useTonWalletsBalances,
    useMutateActiveLedgerAccountDerivation,
    useAddLedgerAccountDerivation,
    useRemoveLedgerAccountDerivation,
    useActiveAccount
} from '../../state/wallet';
import { ListBlock, ListItem, ListItemPayload } from '../../components/List';
import { toFormattedTonBalance } from '../../hooks/balance';
import { Button } from '../../components/fields/Button';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../../libs/routes';
import { SkeletonList } from '../../components/Skeleton';

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

export const LedgerIndexesPage = () => {
    const { t } = useTranslation();
    const account = useActiveAccount();
    if (account.type !== 'ledger') {
        return null;
    }

    return (
        <>
            <SubHeader title={t('settings_ledger_indexes')} />
            <InnerBody>
                <LedgerIndexesPageContent account={account} />
            </InnerBody>
        </>
    );
};

export const LedgerIndexesPageContent: FC<{
    afterWalletOpened?: () => void;
    account: AccountLedger;
}> = ({ afterWalletOpened, account }) => {
    const { t } = useTranslation();

    const { mutateAsync: selectDerivation, isLoading: isSelectDerivationLoading } =
        useMutateActiveLedgerAccountDerivation();
    const navigate = useNavigate();

    const { data: balances } = useTonWalletsBalances(
        account.allAvailableDerivations.map(
            d => d.tonWallets.find(w => w.id === d.activeTonWalletId)!.rawAddress
        )
    );

    const { mutate: addDerivation, isLoading: isAddingDerivationLoading } =
        useAddLedgerAccountDerivation();

    const { mutate: hideDerivation, isLoading: isHideDerivationLoading } =
        useRemoveLedgerAccountDerivation();

    const onOpenDerivation = async (index: number) => {
        if (index !== account.activeDerivationIndex) {
            await selectDerivation({ accountId: account.id, derivationIndex: index });
        }
        navigate(AppRoute.home);
        afterWalletOpened?.();
    };

    const onAddDerivation = async (index: number) => {
        addDerivation({
            accountId: account.id,
            derivationIndex: index
        });
    };

    const onHideDerivation = async (index: number) => {
        hideDerivation({
            accountId: account.id,
            derivationIndex: index
        });
    };

    if (!balances) {
        return <SkeletonList size={account.allAvailableDerivations.length} />;
    }

    const isLoading =
        isSelectDerivationLoading || isAddingDerivationLoading || isHideDerivationLoading;
    const canHide = account.derivations.length > 1;

    return (
        <ListBlock>
            {balances.map((balance, index) => {
                const derivationIndex = account.allAvailableDerivations[index].index;

                const isDerivationAdded = account.derivations.some(
                    d => d.index === derivationIndex
                );

                return (
                    <ListItem hover={false} key={balance.address}>
                        <ListItemPayload>
                            <TextContainer>
                                <Label1># {derivationIndex + 1}</Label1>
                                <Body2Secondary>
                                    {toShortValue(formatAddress(balance.address)) + ' '}·
                                    {' ' + toFormattedTonBalance(balance.tonBalance)}&nbsp;TON
                                    {balance.hasJettons && t('wallet_version_and_tokens')}
                                </Body2Secondary>
                            </TextContainer>
                            {isDerivationAdded ? (
                                <ButtonsContainer>
                                    <Button
                                        onClick={() => onOpenDerivation(derivationIndex)}
                                        loading={isLoading}
                                    >
                                        {t('open')}
                                    </Button>
                                    {canHide && (
                                        <Button
                                            onClick={() => onHideDerivation(derivationIndex)}
                                            loading={isLoading}
                                        >
                                            {t('hide')}
                                        </Button>
                                    )}
                                </ButtonsContainer>
                            ) : (
                                <Button
                                    primary
                                    onClick={() => onAddDerivation(derivationIndex)}
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
