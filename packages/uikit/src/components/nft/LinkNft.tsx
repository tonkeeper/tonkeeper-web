import React, {FC, useCallback, useEffect, useMemo, useState} from "react";
import {NFTDNS} from "@tonkeeper/core/dist/entries/nft";
import {Button} from "../fields/Button";
import {useNftDNSLinkData, useWalletJettonList} from "../../state/wallet";
import {toShortAddress} from "@tonkeeper/core/dist/utils/common";
import {useUserJettonList} from "../../state/jetton";
import {useRecipient} from "../../hooks/blockchain/useRecipient";
import {unShiftedDecimals} from "@tonkeeper/core/dist/utils/balance";
import {CryptoCurrency} from "@tonkeeper/core/dist/entries/crypto";
import {useEstimateNftLink} from "../../hooks/blockchain/nft/useEstimateNftLink";
import BigNumber from "bignumber.js";
import {useWalletContext} from "../../hooks/appContext";
import {Notification} from "../Notification";
import {
    ConfirmView,
    ConfirmViewButtons,
    ConfirmViewButtonsSlot, ConfirmViewDetailsFee,
    ConfirmViewDetailsSlot,
    ConfirmViewHeadingSlot
} from "../transfer/ConfirmView";
import {Body2, H3, Label1} from "../Text";
import {ListItem, ListItemPayload} from "../List";
import {ColumnText} from "../Layout";
import {Label} from "../activity/NotificationCommon";
import styled from "styled-components";


export const LinkNft: FC<{ nft: NFTDNS }> = ({nft}) => {
    const { data, isLoading } = useNftDNSLinkData(nft);

    if (!nft.dns) {
        return null;
    }

    const linkedAddress = data?.wallet?.address ? toShortAddress(data?.wallet?.address) : '';

    if (!linkedAddress) {
        return <LinkNftUnlinked nft={nft} isLoading={isLoading} />
    }

    return null
}


const ReplaceButton = styled(Body2)`
  cursor: pointer;
  color: ${(props) => props.theme.textAccent};
`;

const dnsLinkAmount = new BigNumber(0.02);

const LinkNftUnlinked: FC<{ nft: NFTDNS, isLoading: boolean }> = ({nft, isLoading}) => {
    const [isOpen, setIsOpen] = useState(false);
    const onClose = (confirm?: boolean) => {
        setIsOpen(false);
    }
    const walletState = useWalletContext();

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
            linkToAddress: walletState.active.rawAddress,
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

    const child = useCallback(
        () => (
            <ConfirmView
                onClose={onClose}
                recipient={recipient}
                amount={amount}
                jettons={filter}
            >
                <ConfirmViewHeadingSlot>
                    <H3>Confirm transaction</H3>
                </ConfirmViewHeadingSlot>
                <ConfirmViewDetailsSlot>
                    <ListItem hover={false}>
                        <ListItemPayload>
                            <Label>
                                Wallet address
                            </Label>
                            <ColumnText right text={toShortAddress(walletState.active.rawAddress)} secondary={<ReplaceButton>Replace</ReplaceButton>} />
                        </ListItemPayload>
                    </ListItem>
                    <ConfirmViewDetailsFee />
                </ConfirmViewDetailsSlot>
                <ConfirmViewButtonsSlot>
                    <ConfirmViewButtons withCancelButton />
                </ConfirmViewButtonsSlot>
            </ConfirmView>
        ),
        [recipient, amount, filter]
    );

    return <>
        <Button
            type="button"
            size="large"
            secondary
            fullWidth
            loading={isFeeLoading || isRecipientLoading || isLoading}
            onClick={() => setIsOpen(true)}
        >
           Link Domain
        </Button>
        <Notification
            isOpen={isOpen}
            hideButton
            handleClose={() => onClose}
            backShadow
        >
            {child}
        </Notification>
    </>
}
