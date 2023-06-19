import BigNumber from "bignumber.js";
import React, {FC, useCallback, useEffect, useMemo, useState} from "react";
import {NFTDNS} from "@tonkeeper/core/dist/entries/nft";
import {useTranslation} from "../../hooks/translation";
import {useDateFormat} from "../../hooks/dateFormat";
import {expiringNFTDaysPeriod, useWalletJettonList, useWalletNftList} from "../../state/wallet";
import {useUserJettonList} from "../../state/jetton";
import {useGetToAccount} from "../transfer/RecipientView";
import {useEstimateNftRenew} from "../../hooks/blockchain/nft/useEstimateNftRenew";
import {unShiftedDecimals} from "@tonkeeper/core/dist/utils/balance";
import {CryptoCurrency} from "@tonkeeper/core/dist/entries/crypto";
import {useRenewNft} from "../../hooks/blockchain/nft/useRenewNft";
import {ConfirmView, ConfirmViewButtons, ConfirmViewButtonsSlot} from "../transfer/ConfirmView";
import {Notification} from "../Notification";
import styled from "styled-components";
import {Button} from "../fields/Button";
import {Body2} from "../Text";
import {useAppContext} from "../../hooks/appContext";
import {AccountsApi} from "@tonkeeper/core/dist/tonApiV2";
import {useQuery} from "@tanstack/react-query";
import {useRecipient} from "../../hooks/blockchain/useRecipient";


const RenewDNSBlock = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const RenewDNSButton = styled(Button)`
  margin-bottom: 0.75rem;
`;

const RenewDNSValidUntil = styled(Body2)`
  color: ${(props) => props.theme.textSecondary};
`;

const useDNSNFTRefresh = (nft: NFTDNS) => {
    const { tonApiV2 } = useAppContext();
    const timeout = 1000 * 60 * 2;
    const waitForDomainRenewed = async (
        startTimestamp?: number
    ): Promise<boolean> => {
        const response = await new AccountsApi(tonApiV2).getDnsExpiring({
            accountId: nft.owner!.address,
            period: expiringNFTDaysPeriod,
        });
        const dns = response.items.find((item) => item.name === nft.dns);

        if (!dns || !dns?.expiringAt) {
            return true;
        }

        startTimestamp ||= Date.now();
        if (Date.now() - startTimestamp < timeout) {
            return waitForDomainRenewed(startTimestamp);
        }

        return false;
    };

    return useQuery({
        queryKey: ['nft-dns-renewing_' + nft.dns],
        queryFn: () => waitForDomainRenewed(),
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        enabled: false,
    });
};


const dnsRenewAmount = new BigNumber(0.02);
export const RenewNft: FC<{
    nftItem: NFTDNS;
}> = ({ nftItem }) => {
    const { t } = useTranslation();
    const expiresAtFormatted = useDateFormat(nftItem.expiresAt);

    const { refetch: refetchAllNFT } = useWalletNftList();
    const {
        data: dnsRenewed,
        isFetching: dnsRenewedLoading,
        refetch: refetchDnsRenewed,
    } = useDNSNFTRefresh(nftItem);
    useEffect(() => {
        if (dnsRenewed) {
            refetchAllNFT();
        }
    }, [dnsRenewed, refetchAllNFT]);

    const [isOpen, setIsOpen] = useState(false);
    const onClose = useCallback(
        (confirmed?: boolean) => {
            setIsOpen(false);

            if (confirmed) {
                refetchDnsRenewed();
            }
        },
        [refetchDnsRenewed]
    );

    const { data: jettons } = useWalletJettonList();
    const filter = useUserJettonList(jettons);

    const { recipient, isLoading: isRecipientLoading } = useRecipient(nftItem.address);

    const {
        isLoading: isFeeLoading,
        data: fee,
        mutate: calculateFee,
    } = useEstimateNftRenew();
    useEffect(() => {
        calculateFee({
            nftAddress: nftItem.address,
            amount: unShiftedDecimals(dnsRenewAmount),
        });
    }, [nftItem.address]);
    const amount = useMemo(
        () => ({
            jetton: CryptoCurrency.TON,
            done: false,
            amount: dnsRenewAmount,
            fee: fee!,
            max: false,
        }),
        [fee]
    );

    const { mutateAsync: renewMutateAsync, ...renewNftMutation} = useRenewNft();

    const child = useCallback(
        () => (
            <ConfirmView
                onClose={onClose}
                recipient={recipient}
                amount={amount}
                jettons={filter}
                mutateAsync={() => renewMutateAsync({nftAddress: nftItem.address, fee: fee!, amount: dnsRenewAmount})}
                {...renewNftMutation}
            >
                <ConfirmViewButtonsSlot>
                    <ConfirmViewButtons withCancelButton />
                </ConfirmViewButtonsSlot>
            </ConfirmView>
        ),
        [recipient, amount, filter]
    );

    return (
        <>
            <RenewDNSBlock>
                <RenewDNSButton
                    type="button"
                    disabled={dnsRenewedLoading || dnsRenewed}
                    loading={!dnsRenewedLoading && (isFeeLoading || isRecipientLoading)}
                    onClick={() => setIsOpen(true)}
                    size="large"
                    secondary
                    fullWidth
                >
                    {dnsRenewedLoading
                        ? t('renew_nft_in_progress')
                        : dnsRenewed
                            ? t('renew_nft_renewed')
                            : t('renew_nft').replace('%1%', dnsRenewAmount.toString())}
                </RenewDNSButton>
                {!dnsRenewed && (
                    <RenewDNSValidUntil>
                        {t('renew_nft_expiration_date').replace('%1%', expiresAtFormatted)}
                    </RenewDNSValidUntil>
                )}
            </RenewDNSBlock>
            <Notification
                isOpen={isOpen}
                hideButton
                handleClose={() => onClose}
                backShadow
            >
                {child}
            </Notification>
        </>
    );
};
