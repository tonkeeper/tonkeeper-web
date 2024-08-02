import { ListBlock, ListItem, ListItemPayload } from '../List';
import styled from 'styled-components';
import { Body1, Body2, H2, Label1 } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useState } from 'react';
import { useTonWalletsBalances } from '../../state/wallet';
import { SkeletonList } from '../Skeleton';
import { toFormattedTonBalance } from '../../hooks/balance';
import { Checkbox } from '../fields/Checkbox';
import { Button } from '../fields/Button';
import { ChevronLeftIcon } from '../Icon';
import { RoundedButton } from '../fields/RoundedButton';
import { AccountLedger } from '@tonkeeper/core/dist/entries/account';

const Wrapper = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const BackButtonContainer = styled.div`
    padding: 8px;
    margin-bottom: 24px;
    margin-right: auto;
`;

const Body1Styled = styled(Body1)`
    margin-top: 4px;
    margin-bottom: 32px;
    color: ${p => p.theme.textSecondary};
`;

const SkeletonListStyled = styled(SkeletonList)`
    width: 100%;
`;

const ListBlockStyled = styled(ListBlock)`
    width: 100%;
`;

const TextContainer = styled.span`
    flex-direction: column;
    display: flex;
    align-items: flex-start;
`;

const Body2Secondary = styled(Body2)`
    color: ${props => props.theme.textSecondary};
`;

const SubmitBlock = styled.div`
    padding: 16px 0 32px;
    flex: 1;
    display: flex;
    align-items: flex-end;
    width: 100%;
`;

export const ChoseLedgerIndexes: FC<{
    account: AccountLedger;
    onSubmit: (indexes: number[]) => void;
    onBack: () => void;
    isLoading?: boolean;
}> = ({ account, onSubmit, onBack, isLoading }) => {
    const { t } = useTranslation();

    const { data: balances } = useTonWalletsBalances(
        account.allAvailableDerivations.map(
            d => d.tonWallets.find(w => w.id === d.activeTonWalletId)!.rawAddress
        )
    );
    const [checkedIndexes, setCheckedIndexes] = useState<number[]>(account.addedDerivationsIndexes);

    const toggleIndex = (index: number, isChecked: boolean) => {
        setCheckedIndexes(state =>
            isChecked ? state.concat(index) : state.filter(i => i !== index)
        );
    };

    return (
        <Wrapper>
            <BackButtonContainer>
                <RoundedButton onClick={onBack}>
                    <ChevronLeftIcon />
                </RoundedButton>
            </BackButtonContainer>
            <H2>{t('choose_wallets_title')}</H2>
            <Body1Styled>{t('choose_wallets_subtitle')}</Body1Styled>
            {!balances ? (
                <SkeletonListStyled size={account.allAvailableDerivations.length} />
            ) : (
                <>
                    <ListBlockStyled>
                        {balances.map((balance, index) => {
                            const derivationIndex = account.allAvailableDerivations[index].index;
                            return (
                                <ListItem hover={false} key={balance.address}>
                                    <ListItemPayload>
                                        <TextContainer>
                                            <Label1># {derivationIndex + 1}</Label1>
                                            <Body2Secondary>
                                                {toShortValue(formatAddress(balance.address))}
                                                &nbsp;·&nbsp;
                                                {toFormattedTonBalance(balance.tonBalance)}&nbsp;TON
                                                {balance.hasJettons &&
                                                    t('wallet_version_and_tokens')}
                                            </Body2Secondary>
                                        </TextContainer>
                                        <Checkbox
                                            checked={checkedIndexes.includes(derivationIndex)}
                                            onChange={isChecked =>
                                                toggleIndex(derivationIndex, isChecked)
                                            }
                                        />
                                    </ListItemPayload>
                                </ListItem>
                            );
                        })}
                    </ListBlockStyled>
                    <SubmitBlock>
                        <Button
                            fullWidth
                            primary
                            disabled={!checkedIndexes.length}
                            onClick={() => onSubmit(checkedIndexes)}
                            loading={isLoading}
                        >
                            {t('continue')}
                        </Button>
                    </SubmitBlock>
                </>
            )}
        </Wrapper>
    );
};
