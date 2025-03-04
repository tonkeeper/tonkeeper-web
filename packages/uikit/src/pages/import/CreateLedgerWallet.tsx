import { styled } from 'styled-components';
import { Button } from '../../components/fields/Button';
import { useTranslation } from '../../hooks/translation';
import {
    useAddLedgerAccountMutation,
    useConnectLedgerMutation,
    useLedgerWallets
} from '../../state/ledger';
import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LedgerTonTransport } from '@tonkeeper/core/dist/service/ledger/connector';
import { Body2, H2Label2Responsive } from '../../components/Text';
import { useAppSdk } from '../../hooks/appSdk';
import { AppRoute } from '../../libs/routes';
import { useNativeBackButton } from '../../components/BackButton';
import { SpinnerIcon } from '../../components/Icon';
import { ListBlock, ListItem } from '../../components/List';
import { formatAddress } from '@tonkeeper/core/dist/utils/common';
import { Checkbox } from '../../components/fields/Checkbox';
import { UpdateWalletName } from '../../components/create/WalletName';
import { toFormattedTonBalance } from '../../hooks/balance';
import { AddWalletContext } from '../../components/create/AddWalletContext';
import {
    OnCloseInterceptor,
    useSetNotificationOnBack,
    useSetNotificationOnCloseInterceptor
} from '../../components/Notification';
import { LedgerConnectionSteps } from '../../components/ledger/LedgerConnectionSteps';
import { useConfirmDiscardNotification } from '../../components/modals/ConfirmDiscardNotificationControlled';
import { useNavigate } from "../../hooks/router/useNavigate";

const ConnectLedgerWrapper = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
`;

const H2Styled = styled(H2Label2Responsive)`
    margin-bottom: 1rem;
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

export const CreateLedgerWallet: FC<{ afterCompleted: () => void }> = ({ afterCompleted }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const sdk = useAppSdk();
    const back = useCallback(() => navigate(AppRoute.home), [navigate]);
    useNativeBackButton(sdk, back);
    const [moveNext, setMoveNext] = useState(false);

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

    useEffect(() => {
        if (tonTransport) {
            setTimeout(() => setMoveNext(true), 500);
        }
    }, [tonTransport]);

    const { navigateHome } = useContext(AddWalletContext);
    useSetNotificationOnBack(navigateHome);

    if (moveNext) {
        return (
            <ChooseLedgerAccounts
                onCancel={back}
                tonTransport={tonTransport!}
                afterCompleted={afterCompleted}
            />
        );
    }

    let currentStep: 'connect' | 'open-ton' | 'all-completed' = 'connect';
    if (isDeviceConnected) {
        currentStep = 'open-ton';
    }
    if (tonTransport) {
        currentStep = 'all-completed';
    }

    return (
        <ConnectLedgerWrapper>
            <H2Styled>{t('ledger_connect_header')}</H2Styled>
            <LedgerConnectionSteps currentStep={currentStep} />
            <ButtonsBlock>
                <Button secondary onClick={back}>
                    {t('cancel')}
                </Button>
                <Button
                    primary
                    loading={isLedgerConnecting || !!tonTransport}
                    onClick={onStartConnection}
                >
                    {t('try_again')}
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

const ChooseLedgerAccounts: FC<{
    tonTransport: LedgerTonTransport;
    onCancel: () => void;
    afterCompleted: () => void;
}> = ({ tonTransport, onCancel, afterCompleted }) => {
    const { t } = useTranslation();
    const totalAccounts = 10;
    const { mutateAsync: getLedgerWallets, data: ledgerAccountData } =
        useLedgerWallets(totalAccounts);
    const [selectedIndexes, setSelectedIndexes] = useState<Record<number, boolean>>({});

    const { mutateAsync: addAccountsMutation, isLoading: isAdding } = useAddLedgerAccountMutation();

    const [accountsSelected, setAccountsSelected] = useState<boolean>();

    useEffect(() => {
        getLedgerWallets(tonTransport).then(data => setSelectedIndexes(data.preselectedIndexes));
    }, [tonTransport]);

    const chosenSomeAccounts = !!Object.values(selectedIndexes).filter(Boolean).length;

    const toFormattedAddress = (address: string) => {
        const userFriendlyAddress = formatAddress(address);
        return `${userFriendlyAddress.slice(0, 8)}...${userFriendlyAddress.slice(-8)}`;
    };

    const onAdd = () => {
        setAccountsSelected(true);
    };

    const { navigateHome } = useContext(AddWalletContext);
    const onBack = useMemo(() => {
        if (!accountsSelected) {
            return navigateHome;
        }

        return () => setAccountsSelected(false);
    }, [navigateHome, accountsSelected]);
    useSetNotificationOnBack(onBack);

    const { onOpen: openConfirmDiscard } = useConfirmDiscardNotification();
    const onCloseInterceptor = useMemo<OnCloseInterceptor>(() => {
        return closeModal => {
            openConfirmDiscard({
                onClose: discard => {
                    if (discard) {
                        closeModal();
                    }
                }
            });
        };
    }, [openConfirmDiscard]);
    useSetNotificationOnCloseInterceptor(onCloseInterceptor);

    if (accountsSelected) {
        return (
            <UpdateWalletName
                walletEmoji={ledgerAccountData!.emoji}
                name={ledgerAccountData!.name}
                submitHandler={({ name, emoji }) =>
                    addAccountsMutation({
                        name,
                        emoji,
                        allWallets: ledgerAccountData!.wallets,
                        walletsIndexesToAdd: Object.entries(selectedIndexes)
                            .filter(([, v]) => v)
                            .map(([k]) => Number(k)),
                        accountId: ledgerAccountData!.accountId
                    }).then(afterCompleted)
                }
            />
        );
    }

    return (
        <ConnectLedgerWrapper>
            <H2Styled>{t('ledger_choose_wallets')}</H2Styled>
            <AccountsListWrapper>
                {!ledgerAccountData ? (
                    <AccountsLoadingWrapper>
                        <SpinnerIcon />
                    </AccountsLoadingWrapper>
                ) : (
                    <ListBlock margin={false}>
                        {ledgerAccountData.wallets.map(account => (
                            <ListItemStyled key={account.accountIndex} hover={false}>
                                <Body2>{toFormattedAddress(account.address)}</Body2>
                                &nbsp;
                                <Dot>·</Dot>
                                &nbsp;
                                <Body2Secondary>
                                    {toFormattedTonBalance(account.balance)}&nbsp;TON
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
                    {t('cancel')}
                </Button>
                <Button
                    primary
                    loading={!ledgerAccountData || isAdding}
                    disabled={!chosenSomeAccounts}
                    onClick={onAdd}
                >
                    {t('continue')}
                </Button>
            </ButtonsBlock>
        </ConnectLedgerWrapper>
    );
};
