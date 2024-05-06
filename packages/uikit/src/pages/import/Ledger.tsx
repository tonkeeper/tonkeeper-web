import { styled } from 'styled-components';
import { Button } from '../../components/fields/Button';
import { useTranslation } from '../../hooks/translation';
import {
    useAddLedgerAccountsMutation,
    useConnectLedgerMutation,
    useLedgerAccounts
} from '../../state/ledger';
import React, { FC, useCallback, useEffect, useState } from 'react';
import { LedgerTonTransport } from '@tonkeeper/core/dist/service/ledger/connector';
import { Body1, Body2, Body3, H2 } from '../../components/Text';
import { useNavigate } from 'react-router-dom';
import { useAppSdk } from '../../hooks/appSdk';
import { AppRoute } from '../../libs/routes';
import { useNativeBackButton } from '../../components/BackButton';
import { SpinnerIcon } from '../../components/Icon';
import { ListBlock, ListItem } from '../../components/List';
import { formatAddress } from '@tonkeeper/core/dist/utils/common';
import { formatter } from '../../hooks/balance';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { Checkbox } from '../../components/fields/Checkbox';

const ConnectLedgerWrapper = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
`;

const H2Styled = styled(H2)`
    margin-bottom: 0.25rem;
`;

const Body1Styled = styled(Body1)`
    margin-bottom: 0.5rem;
    color: ${p => p.theme.textSecondary};
`;

const CardStyled = styled.div`
    box-sizing: border-box;
    padding: 1rem;
    width: 100%;
    margin: 1rem 0;
    background: ${p => p.theme.backgroundContent};
    border-radius: ${p => p.theme.corner2xSmall};
    min-height: 264px;
`;

const ImageStyled = styled.div`
    width: 100px;
    height: 100px;
    background: #10161f;
    margin: 1rem auto;
`;

const Steps = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const ButtonsBlock = styled.div`
    margin-top: 1rem;
    display: flex;
    gap: 8px;
    width: 100%;

    > * {
        flex: 1;
    }
`;

export const PairLedger = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const sdk = useAppSdk();
    const back = useCallback(() => navigate(AppRoute.home), [navigate]);
    useNativeBackButton(sdk, back);

    const {
        isDeviceConnected,
        mutate: connectLedger,
        isLoading: isLedgerConnecting,
        reset: resetConnection,
        data: tonTransport
    } = useConnectLedgerMutation();

    const onStartConnection = useCallback(() => {
        resetConnection();
        connectLedger();
    }, []);

    useEffect(() => {
        onStartConnection();

        return resetConnection;
    }, []);

    if (tonTransport) {
        return <ChooseLedgerAccounts onCancel={back} tonTransport={tonTransport} />;
    }

    return (
        <ConnectLedgerWrapper>
            <H2Styled>Connect Ledger</H2Styled>
            <Body1Styled>Connect your Ledger to your device</Body1Styled>
            <CardStyled>
                <ImageStyled />
                <Steps>
                    <Body3>Connect ledger device</Body3>
                    {isDeviceConnected && <Body3>Open TON App in your Ledger</Body3>}
                </Steps>
            </CardStyled>
            <ButtonsBlock>
                <Button secondary onClick={back}>
                    Cancel
                </Button>
                <Button primary loading={isLedgerConnecting} onClick={onStartConnection}>
                    Continue
                </Button>
            </ButtonsBlock>
        </ConnectLedgerWrapper>
    );
};

const AccountsListWrapper = styled.div`
    width: 100%;
`;

const AccountsLoadingWrapper = styled.div`
    height: 549px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const ListItemStyled = styled(ListItem)`
    padding: 16px 12px;
    font-family: ${props => props.theme.fontMono};

    &:not(:first-child) {
        border-top: 1px solid ${props => props.theme.separatorCommon};
    }
`;

const Dot = styled(Body2)`
    color: ${props => props.theme.textTertiary};
`;

const Body2Secondary = styled(Body2)`
    color: ${props => props.theme.textSecondary};
`;

const CheckboxStyled = styled(Checkbox)`
    margin-left: auto;
    border-top: none !important;
    padding-top: 0 !important;
`;

const ChooseLedgerAccounts: FC<{ tonTransport: LedgerTonTransport; onCancel: () => void }> = ({
    tonTransport,
    onCancel
}) => {
    const totalAccounts = 10;
    const { mutate: getLedgerAccounts, data: ledgerAccounts } = useLedgerAccounts(totalAccounts);
    const [selectedIndexes, setSelectedIndexes] = useState<Record<number, boolean>>({});

    const { mutate: addAccounts, isLoading: isAdding } = useAddLedgerAccountsMutation();

    useEffect(() => {
        getLedgerAccounts(tonTransport);
    }, [tonTransport]);

    const chosenSomeAccounts = !!Object.values(selectedIndexes).filter(Boolean).length;

    const toFormattedAddress = (address: string) => {
        const userFriendlyAddress = formatAddress(address);
        return `${userFriendlyAddress.slice(0, 8)}...${userFriendlyAddress.slice(-8)}`;
    };

    const toFormattedBalance = (weiBalance: number) => {
        return formatter.format(shiftedDecimals(weiBalance, 9));
    };

    const onAdd = () => {
        const chosenIndexes = Object.entries(selectedIndexes)
            .filter(([, v]) => v)
            .map(([k]) => Number(k));
        addAccounts(
            ledgerAccounts!.filter(account => chosenIndexes.includes(account.accountIndex))
        );
    };

    return (
        <ConnectLedgerWrapper>
            <H2Styled>Choose Wallets</H2Styled>
            <Body1Styled>Choose wallets you want to add.</Body1Styled>
            <AccountsListWrapper>
                {!ledgerAccounts ? (
                    <AccountsLoadingWrapper>
                        <SpinnerIcon />
                    </AccountsLoadingWrapper>
                ) : (
                    <ListBlock>
                        {ledgerAccounts.map(account => (
                            <ListItemStyled key={account.accountIndex} hover={false}>
                                <Body2>{toFormattedAddress(account.address)}</Body2>
                                &nbsp;
                                <Dot>·</Dot>
                                &nbsp;
                                <Body2Secondary>
                                    {toFormattedBalance(account.balance)}&nbsp;TON
                                </Body2Secondary>
                                <CheckboxStyled
                                    checked={selectedIndexes[account.accountIndex]}
                                    onChange={() =>
                                        setSelectedIndexes(s => ({
                                            ...s,
                                            [account.accountIndex]: !s[account.accountIndex]
                                        }))
                                    }
                                />
                            </ListItemStyled>
                        ))}
                    </ListBlock>
                )}
            </AccountsListWrapper>
            <ButtonsBlock>
                <Button secondary onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    primary
                    loading={!ledgerAccounts || isAdding}
                    disabled={!chosenSomeAccounts}
                    onClick={onAdd}
                >
                    Add
                </Button>
            </ButtonsBlock>
        </ConnectLedgerWrapper>
    );
};
