import { useQueryClient } from '@tanstack/react-query';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { formatFiatCurrency } from '../../hooks/balance';
import { QueryKey } from '../../libs/queryKey';
import { useActiveAccount, useActiveTonNetwork } from '../../state/wallet';
import { Body2, Body3, Label2, Num2 } from '../Text';
import { SkeletonText } from '../shared/Skeleton';
import { useWalletTotalBalance } from '../../state/asset';
import { useTranslation } from '../../hooks/translation';
import { AccountAndWalletBadgesGroup, NetworkBadge } from '../account/AccountBadge';
import {
    AccountMAM,
    AccountTonMnemonic,
    getNetworkByAccount
} from '@tonkeeper/core/dist/entries/account';
import { DropDownContent, DropDownItem, DropDownItemsDivider } from '../DropDown';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { SelectDropDown } from '../fields/Select';
import { TON_ASSET, TRON_TRX_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { ChevronDownIcon, CopyIcon, DoneIcon } from '../Icon';
import { useActiveTronWallet } from '../../state/tron/tron';

const Block = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: 32px;
`;

const Body = styled(Label2)`
    color: ${props => props.theme.textSecondary};
    user-select: none;
    display: flex;
    cursor: pointer;

    transition: transform 0.2s ease;
    &:active {
        transform: scale(0.97);
    }
`;

const Amount = styled(Num2)`
    margin-bottom: 0.5rem;
    user-select: none;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
`;

const Error = styled.div`
    height: 26px;
    text-align: center;
    width: 100%;
`;

const Text = styled(Body3)`
    line-height: 26px;
    color: ${props => props.theme.textSecondary};
`;

const AccountAndWalletBadgesGroupStyled = styled(AccountAndWalletBadgesGroup)`
    display: inline-flex;
    margin-left: 3px;
`;

const MessageBlock: FC<{ error?: Error | null; isFetching: boolean }> = ({ error }) => {
    if (error) {
        return (
            <Error>
                <Text>{error.message}</Text>
            </Error>
        );
    }

    return <Error></Error>;
};

export const BalanceSkeleton = () => {
    return (
        <Block>
            <Error></Error>
            <Amount>
                <SkeletonText size="large" width="120px" />
            </Amount>
            <Body>
                <SkeletonText size="small" width="60px" />
            </Body>
        </Block>
    );
};

export const Balance: FC<{
    error?: Error | null;
    isFetching: boolean;
}> = ({ error, isFetching }) => {
    const account = useActiveAccount();
    const { fiat } = useAppContext();
    const client = useQueryClient();
    const network = getNetworkByAccount(account);

    const tronWallet = useActiveTronWallet();

    const { data: total } = useWalletTotalBalance();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!total || total.toString() === '0') {
                client.invalidateQueries([QueryKey.total]);
            }
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [total]);

    return (
        <Block>
            <MessageBlock error={error} isFetching={isFetching} />
            <Amount>
                <span>{formatFiatCurrency(fiat, total || 0)}</span>
                <NetworkBadge network={network} />
            </Amount>
            {tronWallet ? <AddressMultiChain /> : <AddressSingleChain />}
        </Block>
    );
};

const BlockchainImage = styled.img`
    border-radius: ${p => p.theme.cornerFull};
    width: 24px;
    height: 24px;
`;

const DropDownItemStyled = styled(DropDownItem)`
    padding: 8px 12px;
    gap: 12px;

    font-family: ${p => p.theme.fontMono};

    > *:last-child {
        margin-left: auto;
    }
`;

const MultichainLine = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 20px;
    color: ${props => props.theme.textSecondary};

    > svg {
        color: ${props => props.theme.iconTertiary};
    }
`;

const CopyIconStyled = styled(CopyIcon)`
    color: ${p => p.theme.iconTertiary};
    cursor: pointer;
`;

const DoneIconStyled = styled(DoneIcon)`
    color: ${p => p.theme.accentGreen};
`;

const SelectDropDownStyled = styled(SelectDropDown)`
    width: fit-content;
`;

const AddressMultiChain = () => {
    const { t } = useTranslation();
    const account = useActiveAccount() as AccountMAM | AccountTonMnemonic;
    const activeWallet = account.activeTonWallet;

    const [tonCopied, setIsTonCopied] = useState(false);
    const [tronCopied, setIsTronCopied] = useState(false);

    const sdk = useAppSdk();

    const tonAddress = formatAddress(activeWallet.rawAddress, useActiveTonNetwork());
    const tronAddress = account.activeTronWallet!.address;

    const timeoutRef = useRef<
        Record<keyof typeof BLOCKCHAIN_NAME, ReturnType<typeof setTimeout> | undefined>
    >({
        [BLOCKCHAIN_NAME.TON]: undefined,
        [BLOCKCHAIN_NAME.TRON]: undefined
    });

    const onCopy = (chain: BLOCKCHAIN_NAME) => {
        const setIsCopied = chain === BLOCKCHAIN_NAME.TON ? setIsTonCopied : setIsTronCopied;
        clearTimeout(timeoutRef.current[chain]);
        sdk.copyToClipboard(chain === BLOCKCHAIN_NAME.TON ? tonAddress : tronAddress);
        setIsCopied(true);
        timeoutRef.current[chain] = setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <SelectDropDownStyled
            top="0"
            right="-8px"
            width="200px"
            payload={() => (
                <DropDownContent>
                    <DropDownItemStyled
                        isSelected={false}
                        onClick={() => {
                            onCopy(BLOCKCHAIN_NAME.TON);
                        }}
                    >
                        <BlockchainImage src={TON_ASSET.image} />
                        <Body2>{toShortValue(tonAddress)}</Body2>
                        {tonCopied ? <DoneIconStyled /> : <CopyIconStyled />}
                    </DropDownItemStyled>
                    <DropDownItemsDivider />
                    <DropDownItemStyled
                        isSelected={false}
                        onClick={() => {
                            onCopy(BLOCKCHAIN_NAME.TRON);
                        }}
                    >
                        <BlockchainImage src={TRON_TRX_ASSET.image} />
                        <Body2>{toShortValue(tronAddress)}</Body2>
                        {tronCopied ? <DoneIconStyled /> : <CopyIconStyled />}
                    </DropDownItemStyled>
                    <DropDownItemsDivider />
                </DropDownContent>
            )}
        >
            <MultichainLine>
                <Body2>{t('multichain')}</Body2>
                <AccountAndWalletBadgesGroup
                    account={account}
                    walletId={account.activeTonWallet.id}
                    size="s"
                />
                <ChevronDownIcon />
            </MultichainLine>
        </SelectDropDownStyled>
    );
};

const AddressSingleChain = () => {
    const sdk = useAppSdk();
    const account = useActiveAccount();
    const { t } = useTranslation();
    const network = useActiveTonNetwork();
    const address = formatAddress(account.activeTonWallet.rawAddress, network);

    return (
        <Body onClick={() => sdk.copyToClipboard(address, t('address_copied'))}>
            {toShortValue(address)}
            <AccountAndWalletBadgesGroupStyled
                account={account}
                walletId={account.activeTonWallet.id}
            />
        </Body>
    );
};
