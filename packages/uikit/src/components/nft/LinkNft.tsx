import React, {FC, useCallback, useEffect, useMemo, useState} from "react";
import {NFTDNS} from "@tonkeeper/core/dist/entries/nft";
import {Button} from "../fields/Button";
import {useNftDNSLinkData, useWalletJettonList} from "../../state/wallet";
import {areEqAddresses, toShortAddress} from "@tonkeeper/core/dist/utils/common";
import {useUserJettonList} from "../../state/jetton";
import {useRecipient} from "../../hooks/blockchain/useRecipient";
import {unShiftedDecimals} from "@tonkeeper/core/dist/utils/balance";
import {CryptoCurrency} from "@tonkeeper/core/dist/entries/crypto";
import {useEstimateNftLink} from "../../hooks/blockchain/nft/useEstimateNftLink";
import BigNumber from "bignumber.js";
import {useAppContext, useWalletContext} from "../../hooks/appContext";
import {FullHeightBlock, Notification} from "../Notification";
import {
    ConfirmView,
    ConfirmViewButtons,
    ConfirmViewButtonsSlot, ConfirmViewDetailsFee,
    ConfirmViewDetailsSlot,
    ConfirmViewHeadingSlot, ConfirmViewTitleSlot
} from "../transfer/ConfirmView";
import {Body1, Body2, H3, Label1} from "../Text";
import {ListItem, ListItemPayload} from "../List";
import {ColumnText, Gap} from "../Layout";
import {Label} from "../activity/NotificationCommon";
import styled from "styled-components";
import {Input} from "../fields/Input";
import {Address} from "ton-core";
import {useAreNftActionsDisabled} from "../../hooks/blockchain/nft/useAreNftActionsDisabled";
import {useLinkNft} from "../../hooks/blockchain/nft/useLinkNft";
import {useQueryChangeWait} from "../../hooks/useQueryChangeWait";
import {useTranslation} from "../../hooks/translation";


export const LinkNft: FC<{ nft: NFTDNS }> = ({nft}) => {
    const query = useNftDNSLinkData(nft);
    const { data, isLoading } = query;

    const linkedAddress = data?.wallet?.address || '';

    const { refetch, isLoading: isWaitingForUpdate } = useQueryChangeWait(query, current => !!linkedAddress !== !!current?.wallet?.address);

    if (!nft.dns) {
        return null;
    }

    if (!linkedAddress) {
        return <LinkNftUnlinked nft={nft} isLoading={isLoading || isWaitingForUpdate} refetch={refetch} />
    }

    return <LinkNftLinked nft={nft} linkedAddress={linkedAddress} isLoading={isWaitingForUpdate} refetch={refetch} />
}


const ReplaceButton = styled(Body2)`
  cursor: pointer;
  color: ${(props) => props.theme.textAccent};
`;

const dnsLinkAmount = new BigNumber(0.02);

const LinkNftUnlinked: FC<{ nft: NFTDNS, isLoading: boolean, refetch: () => void }> = ({nft, isLoading, refetch}) => {
    const { t } = useTranslation();
    const [openedView, setOpenedView] = useState<'confirm' | 'wallet' | undefined>();
    const onClose = (confirm?: boolean) => {
        setOpenedView(undefined);
        if (confirm) {
            refetch();
        }
    }
    const walletState = useWalletContext();
    const [linkToAddress, setLinkToAddress] = useState(walletState.active.rawAddress);

    const { data: jettons } = useWalletJettonList();
    const filter = useUserJettonList(jettons);

    const { recipient, isLoading: isRecipientLoading } = useRecipient(nft.address);

    const {
        isLoading: isFeeLoading,
        data: fee,
        mutateAsync: calculateFee,
    } = useEstimateNftLink();
    useEffect(() => {
        calculateFee({
            nftAddress: nft.address,
            linkToAddress: linkToAddress,
            amount: unShiftedDecimals(dnsLinkAmount),
        });
    }, [nft.address]);
    const amount = useMemo(
        () => ({
            jetton: CryptoCurrency.TON,
            done: false,
            amount: dnsLinkAmount,
            fee: fee!,
            max: false,
        }),
        [fee]
    );

    const onSaveLinkToAddress = useCallback(async (address: string) => {
        setLinkToAddress(address);
        await calculateFee({
            nftAddress: nft.address,
            linkToAddress: address,
            amount: unShiftedDecimals(dnsLinkAmount),
        });
        setOpenedView('confirm')
    }, [calculateFee, nft.address])

    const { mutateAsync, ...mutationRest } = useLinkNft();
    const sendLinkNftMutation = useCallback(() =>
            mutateAsync({ nftAddress: nft.address, linkToAddress, amount: unShiftedDecimals(dnsLinkAmount), fee: fee! }
            )
        , [mutateAsync, nft.address, fee, linkToAddress]);

    const confirmChild = () => (
            <ConfirmView
                onClose={onClose}
                recipient={recipient}
                amount={amount}
                jettons={filter}
                mutateAsync={sendLinkNftMutation}
                {...mutationRest}
            >
                <ConfirmViewTitleSlot />
                <ConfirmViewHeadingSlot />
                <ConfirmViewDetailsSlot>
                    <ListItem hover={false}>
                        <ListItemPayload>
                            <Label>
                                { t('wallet_address') }
                            </Label>
                            <ColumnText right text={toShortAddress(linkToAddress)} secondary={<ReplaceButton onClick={() => setOpenedView('wallet')}>{ t('replace') }</ReplaceButton>} />
                        </ListItemPayload>
                    </ListItem>
                    <ConfirmViewDetailsFee />
                </ConfirmViewDetailsSlot>
                <ConfirmViewButtonsSlot>
                    <ConfirmViewButtons withCancelButton />
                </ConfirmViewButtonsSlot>
            </ConfirmView>
        )

    const chooseWalletChild = useCallback(
        () => (
            <LinkNFTWalletView onSave={onSaveLinkToAddress} isLoading={isFeeLoading} domain={nft.dns} />
        ),
        [onSaveLinkToAddress, isFeeLoading]
    );

    const isDisabled = useAreNftActionsDisabled(nft);

    return <>
        <Button
            type="button"
            size="large"
            secondary
            fullWidth
            disabled={isDisabled}
            loading={isFeeLoading || isRecipientLoading || isLoading}
            onClick={() => setOpenedView('confirm')}
        >
            { t('link_domain') }
        </Button>
        <Notification
            title={openedView === 'wallet' ? t('wallet_address') : t('confirm_tx')}
            isOpen={!!openedView}
            hideButton
            handleClose={() => onClose()}
            backShadow
        >
            { openedView === 'wallet' ? chooseWalletChild : confirmChild}
        </Notification>
    </>
}

const WalletLabelStyled = styled(Body1)`
  color: ${(props) => props.theme.textSecondary};
  margin-bottom: 1.5rem;
`

const FullHeightBlockStyled = styled(FullHeightBlock)`
  align-items: flex-start;
`

const LinkNFTWalletView: FC<{onSave: (value: string) => void, isLoading: boolean, domain: string}> = ({ onSave, isLoading, domain }) => {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState('');
    const [wasSubmitted, setWasSubmitted] = useState(false);
    const isInputValid = useMemo(() => {
        if (!wasSubmitted) {
            return true;
        }

        try {
            Address.parse(inputValue);
            return true
        } catch {
            return false;
        }
    }, [wasSubmitted, inputValue]);

    const onSubmit: React.FormEventHandler<HTMLFormElement>  = e => {
        e.stopPropagation();
        e.preventDefault();
        setWasSubmitted(true);
        try {
            onSave(Address.parse(inputValue).toRawString());
        } catch { }
    }

    const { standalone } = useAppContext();
    return  <FullHeightBlockStyled onSubmit={onSubmit} standalone={standalone}>
        <WalletLabelStyled>
            { t('add_dns_address').replace('%1%', domain) }
        </WalletLabelStyled>
        <Input disabled={isLoading} isValid={isInputValid} value={inputValue} onChange={setInputValue} label={t('wallet_address')} clearButton />
        <Gap />
        <Button fullWidth size="large" primary disabled={!inputValue} loading={isLoading}>Save</Button>
    </FullHeightBlockStyled>
}

const WarnTextStyled = styled(Body2)`
  margin-top: 0.75rem;
  text-align: center;
  color: ${props => props.theme.accentOrange}
`

const linkToAddress = '';
const LinkNftLinked: FC<{ nft: NFTDNS, linkedAddress: string, isLoading: boolean, refetch: () => void }> = ({nft, linkedAddress, isLoading, refetch}) => {
    const { t } = useTranslation();
    const walletState = useWalletContext();
    const [isOpen, setIsOpen] = useState(false);
    const onClose = (confirm?: boolean) => {
        setIsOpen(false);
        if (confirm) {
            refetch();
        }
    }

    const { data: jettons } = useWalletJettonList();
    const filter = useUserJettonList(jettons);

    const { recipient, isLoading: isRecipientLoading } = useRecipient(nft.address);

    const {
        isLoading: isFeeLoading,
        data: fee,
        mutate: calculateFee,
    } = useEstimateNftLink();
    useEffect(() => {
        calculateFee({
            nftAddress: nft.address,
            linkToAddress,
            amount: unShiftedDecimals(dnsLinkAmount),
        });
    }, [nft.address]);
    const amount = useMemo(
        () => ({
            jetton: CryptoCurrency.TON,
            done: false,
            amount: dnsLinkAmount,
            fee: fee!,
            max: false,
        }),
        [fee]
    );

    const { mutateAsync, ...mutationRest } = useLinkNft();
    const sendLinkNftMutation = useCallback(() => mutateAsync({ nftAddress: nft.address, linkToAddress, amount: unShiftedDecimals(dnsLinkAmount), fee: fee! })
    , [mutateAsync, nft.address, fee]);


    const child = () => (
            <ConfirmView
                onClose={onClose}
                recipient={recipient}
                amount={amount}
                jettons={filter}
                mutateAsync={sendLinkNftMutation}
                {...mutationRest}
            >
                <ConfirmViewTitleSlot />
                <ConfirmViewHeadingSlot />
                <ConfirmViewDetailsSlot>
                    <ConfirmViewDetailsFee />
                </ConfirmViewDetailsSlot>
                <ConfirmViewButtonsSlot>
                    <ConfirmViewButtons withCancelButton />
                </ConfirmViewButtonsSlot>
            </ConfirmView>
        )


    const isDisabled = useAreNftActionsDisabled(nft);

    return <>
        <Button
            type="button"
            size="large"
            secondary
            fullWidth
            disabled={isDisabled}
            loading={isFeeLoading || isRecipientLoading || isLoading}
            onClick={() => setIsOpen(true)}
        >
            { t('linked_with').replace('%1%', toShortAddress(linkedAddress)) }
        </Button>
        {
            !areEqAddresses(linkedAddress, walletState.active.rawAddress) && <WarnTextStyled>{t('dns_linked_with_another_address_warn')}</WarnTextStyled>
        }
        <Notification
            title={t('confirm_unlink')}
            isOpen={isOpen}
            hideButton
            handleClose={() => onClose()}
            backShadow
        >
            { child }
        </Notification>
    </>
}
