import { Address } from '@ton/core';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { NFTDNS } from '@tonkeeper/core/dist/entries/nft';
import { TransferEstimationEvent } from '@tonkeeper/core/dist/entries/send';
import { isStandardTonWallet, WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { getWalletsAddresses } from '@tonkeeper/core/dist/service/walletService';
import { unShiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { areEqAddresses, formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { isTMEDomain } from '@tonkeeper/core/dist/utils/nft';
import BigNumber from 'bignumber.js';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useToast } from '../../hooks/appSdk';
import { useAreNftActionsDisabled } from '../../hooks/blockchain/nft/useAreNftActionsDisabled';
import { useEstimateNftLink } from '../../hooks/blockchain/nft/useEstimateNftLink';
import { useLinkNft } from '../../hooks/blockchain/nft/useLinkNft';
import { useTonRecipient } from '../../hooks/blockchain/useTonRecipient';
import { useTranslation } from '../../hooks/translation';
import { useNotification } from '../../hooks/useNotification';
import { useQueryChangeWait } from '../../hooks/useQueryChangeWait';
import { useActiveTonNetwork, useActiveWallet } from '../../state/wallet';
import { ColumnText, Gap } from '../Layout';
import { ListItem, ListItemPayload } from '../List';
import { Notification, NotificationBlock } from '../Notification';
import { Body1, Body2 } from '../Text';
import { Label } from '../activity/NotificationCommon';
import { Button } from '../fields/Button';
import { Input } from '../fields/Input';
import {
    ConfirmView,
    ConfirmViewButtons,
    ConfirmViewButtonsSlot,
    ConfirmViewDetailsAmount,
    ConfirmViewDetailsFee,
    ConfirmViewDetailsSlot,
    ConfirmViewHeadingSlot,
    ConfirmViewTitleSlot
} from '../transfer/ConfirmView';
import { ConfirmAndCancelMainButton } from '../transfer/common';
import { useNftDNSLinkData } from '../../state/nft';

export const LinkNft: FC<{ nft: NFTDNS }> = ({ nft }) => {
    const toast = useToast();
    const { t } = useTranslation();
    const query = useNftDNSLinkData(nft);
    const { data, isLoading } = query;

    const linkedAddress = data?.wallet?.address || '';

    const {
        refetch,
        isLoading: isWaitingForUpdate,
        isCompleted
    } = useQueryChangeWait(
        query,
        (current, prev) => !!prev?.wallet?.address !== !!current?.wallet?.address
    );

    useEffect(() => {
        if (isCompleted) {
            toast(linkedAddress ? t('dns_address_linked') : t('dns_address_unlinked'));
        }
    }, [isCompleted, linkedAddress]);

    if (!linkedAddress) {
        return (
            <LinkNftUnlinked
                nft={nft}
                isLoading={isLoading || isWaitingForUpdate}
                refetch={refetch}
            />
        );
    }

    return (
        <LinkNftLinked
            nft={nft}
            linkedAddress={linkedAddress}
            isLoading={isWaitingForUpdate}
            refetch={refetch}
        />
    );
};

const ReplaceButton = styled(Body2)<{ isDisabled: boolean }>`
    cursor: pointer;
    color: ${props => (!props.isDisabled ? props.theme.textAccent : props.theme.textSecondary)};
    pointer-events: ${props => (props.isDisabled ? 'none' : 'unset')};
`;

const dnsLinkAmount = new BigNumber(0.02);
const dnsLinkAssetAmount = AssetAmount.fromRelativeAmount({
    asset: TON_ASSET,
    amount: dnsLinkAmount
});

const LinkNftUnlinked: FC<{
    nft: NFTDNS;
    isLoading: boolean;
    refetch: () => void;
}> = ({ nft, isLoading, refetch }) => {
    const notifyError = useNotification();
    const { t } = useTranslation();
    const [openedView, setOpenedView] = useState<'confirm' | 'wallet' | undefined>();
    const walletState = useActiveWallet();
    const [linkToAddress, setLinkToAddress] = useState(walletState.rawAddress);

    const onClose = (confirm?: boolean) => {
        if (openedView === 'wallet') {
            return setOpenedView('confirm');
        }
        setOpenedView(undefined);
        if (confirm) {
            refetch();
        } else {
            setLinkToAddress(walletState.rawAddress);
        }
    };

    const { recipient, isLoading: isRecipientLoading } = useTonRecipient(nft.address);

    const { refetch: refetchEstimateFee, ...estimation } = useEstimateNftLink({
        nftAddress: nft.address,
        amount: unShiftedDecimals(dnsLinkAmount),
        linkToAddress
    });

    const onSaveLinkToAddress = useCallback(
        async (address: string) => {
            setLinkToAddress(address);
            await refetchEstimateFee();
            setOpenedView('confirm');
        },
        [refetchEstimateFee, nft.address]
    );

    const mutation = useLinkNft({
        nftAddress: nft.address,
        amount: unShiftedDecimals(dnsLinkAmount),
        linkToAddress,
        fee: estimation.data?.payload as TransferEstimationEvent
    });

    const isSelectedCurrentAddress = areEqAddresses(linkToAddress, walletState.rawAddress);
    const network = useActiveTonNetwork();

    const confirmChild = () => (
        <ConfirmView
            onClose={onClose}
            recipient={recipient}
            assetAmount={dnsLinkAssetAmount}
            fitContent
            estimation={estimation}
            {...mutation}
        >
            <ConfirmViewTitleSlot />
            <ConfirmViewHeadingSlot />
            <ConfirmViewDetailsSlot>
                <ListItem hover={false}>
                    <ListItemPayload>
                        <Label>
                            {isSelectedCurrentAddress
                                ? t('dns_current_address')
                                : t('wallet_address')}
                        </Label>
                        <ColumnText
                            right
                            text={toShortValue(formatAddress(linkToAddress, network))}
                            secondary={
                                <ReplaceButton
                                    isDisabled={mutation.isLoading}
                                    onClick={() => setOpenedView('wallet')}
                                >
                                    {t('replace')}
                                </ReplaceButton>
                            }
                        />
                    </ListItemPayload>
                </ListItem>
                <ConfirmViewDetailsAmount />
                <ConfirmViewDetailsFee />
            </ConfirmViewDetailsSlot>
            <ConfirmViewButtonsSlot>
                <ConfirmViewButtons MainButton={ConfirmAndCancelMainButton} />
            </ConfirmViewButtonsSlot>
        </ConfirmView>
    );

    const chooseWalletChild = useCallback(
        () => (
            <LinkNFTWalletView
                onSave={onSaveLinkToAddress}
                isLoading={estimation.isFetching}
                domain={nft.dns}
            />
        ),
        [onSaveLinkToAddress, estimation.isFetching]
    );

    const isDisabled = useAreNftActionsDisabled(nft);

    const onOpen = () => {
        if (estimation.error) {
            notifyError(estimation.error as Error);
            return;
        }
        setOpenedView('confirm');
    };

    const isTME = isTMEDomain(nft.dns);

    return (
        <>
            <Button
                type="button"
                size="large"
                secondary
                fullWidth
                disabled={isDisabled}
                loading={estimation.isFetching || isRecipientLoading || isLoading}
                onClick={onOpen}
            >
                {isTME ? t('nft_link_username_button') : t('nft_link_domain_button')}
            </Button>
            <Notification
                title={
                    openedView === 'wallet'
                        ? t('wallet_address')
                        : t('send_screen_steps_comfirm_title')
                }
                isOpen={!!openedView}
                hideButton
                handleClose={() => onClose()}
                backShadow
            >
                {openedView === 'wallet' ? chooseWalletChild : confirmChild}
            </Notification>
        </>
    );
};

const WalletLabelStyled = styled(Body1)`
    color: ${props => props.theme.textSecondary};
    margin-bottom: 1.5rem;
`;

const ChangeWalletContainerStyled = styled(NotificationBlock)`
    align-items: flex-start;
`;

const LinkNFTWalletView: FC<{
    onSave: (value: string) => void;
    isLoading: boolean;
    domain: string;
}> = ({ onSave, isLoading, domain }) => {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState('');
    const [wasSubmitted, setWasSubmitted] = useState(false);
    const isInputValid = useMemo(() => {
        if (!wasSubmitted) {
            return true;
        }

        try {
            Address.parse(inputValue);
            return true;
        } catch {
            return false;
        }
    }, [wasSubmitted, inputValue]);

    const onSubmit: React.FormEventHandler<HTMLFormElement> = e => {
        e.stopPropagation();
        e.preventDefault();
        setWasSubmitted(true);
        try {
            onSave(Address.parse(inputValue).toRawString());
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <ChangeWalletContainerStyled onSubmit={onSubmit}>
            <WalletLabelStyled>{t('add_dns_address').replace('%1%', domain)}</WalletLabelStyled>
            <Input
                disabled={isLoading}
                isValid={isInputValid}
                value={inputValue}
                onChange={setInputValue}
                label={t('wallet_address')}
                clearButton
            />
            <Gap />
            <Button fullWidth size="large" primary disabled={!inputValue} loading={isLoading}>
                Save
            </Button>
        </ChangeWalletContainerStyled>
    );
};

const WarnTextStyled = styled(Body2)`
    text-align: center;
    color: ${props => props.theme.accentOrange};
`;

const linkToAddress = '';
const LinkNftLinked: FC<{
    nft: NFTDNS;
    linkedAddress: string;
    isLoading: boolean;
    refetch: () => void;
}> = ({ nft, linkedAddress, isLoading, refetch }) => {
    const notifyError = useNotification();
    const { t } = useTranslation();
    const walletState = useActiveWallet();
    const [isOpen, setIsOpen] = useState(false);
    const onClose = (confirm?: boolean) => {
        setIsOpen(false);
        if (confirm === true) {
            refetch();
        }
    };

    const { recipient, isLoading: isRecipientLoading } = useTonRecipient(nft.address);

    const estimation = useEstimateNftLink({
        nftAddress: nft.address,
        amount: unShiftedDecimals(dnsLinkAmount),
        linkToAddress
    });

    const mutation = useLinkNft({
        nftAddress: nft.address,
        amount: unShiftedDecimals(dnsLinkAmount),
        linkToAddress,
        fee: estimation.data?.payload as TransferEstimationEvent
    });

    const child = () => (
        <ConfirmView
            onClose={onClose}
            recipient={recipient}
            assetAmount={dnsLinkAssetAmount}
            fitContent
            estimation={estimation}
            {...mutation}
        >
            <ConfirmViewTitleSlot />
            <ConfirmViewHeadingSlot />
            <ConfirmViewDetailsSlot>
                <ConfirmViewDetailsAmount />
                <ConfirmViewDetailsFee />
            </ConfirmViewDetailsSlot>
            <ConfirmViewButtonsSlot>
                <ConfirmViewButtons MainButton={ConfirmAndCancelMainButton} />
            </ConfirmViewButtonsSlot>
        </ConfirmView>
    );

    const isDisabled = useAreNftActionsDisabled(nft);
    const isTME = isTMEDomain(nft.dns);

    const onOpen = () => {
        if (estimation.error) {
            notifyError(estimation.error as Error);
            return;
        }
        setIsOpen(true);
    };
    const network = useActiveTonNetwork();

    const isLinkedWithAnotherWallet = Object.values<{ address: Address; version: WalletVersion }>(
        isStandardTonWallet(walletState) ? getWalletsAddresses(walletState.publicKey, network) : {}
    ).every(({ address }) => !areEqAddresses(address.toRawString(), linkedAddress));

    return (
        <>
            <Button
                type="button"
                size="large"
                secondary
                fullWidth
                disabled={isDisabled}
                loading={estimation.isFetching || isRecipientLoading || isLoading}
                onClick={onOpen}
            >
                {t('nft_unlink_domain_button').replace(
                    '{{address}}',
                    toShortValue(formatAddress(linkedAddress, network))
                )}
            </Button>
            {isLinkedWithAnotherWallet && !isLoading && (
                <WarnTextStyled>
                    {isTME
                        ? t('tme_linked_with_another_address_warn')
                        : t('dns_linked_with_another_address_warn')}
                </WarnTextStyled>
            )}
            <Notification
                title={t('confirm_unlink')}
                isOpen={isOpen}
                hideButton
                handleClose={() => onClose()}
                backShadow
            >
                {child}
            </Notification>
        </>
    );
};
