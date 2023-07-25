import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { NFTDNS } from '@tonkeeper/core/dist/entries/nft';
import { unShiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import BigNumber from 'bignumber.js';
import React, { FC, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useEstimateNftRenew } from '../../hooks/blockchain/nft/useEstimateNftRenew';
import { useRenewNft } from '../../hooks/blockchain/nft/useRenewNft';
import { useRecipient } from '../../hooks/blockchain/useRecipient';
import { toDaysLeft, useDateFormat } from '../../hooks/dateFormat';
import { useTranslation } from '../../hooks/translation';
import { useNotification } from '../../hooks/useNotification';
import { useUserJettonList } from '../../state/jetton';
import { useNftDNSExpirationDate, useWalletJettonList } from '../../state/wallet';
import { Notification } from '../Notification';
import { Body2 } from '../Text';
import { Button } from '../fields/Button';
import { ConfirmView, ConfirmViewButtons, ConfirmViewButtonsSlot } from '../transfer/ConfirmView';
import { useAreNftActionsDisabled } from '../../hooks/blockchain/nft/useAreNftActionsDisabled';
import { useQueryChangeWait } from '../../hooks/useQueryChangeWait';
import { useToast } from '../../hooks/appSdk';

const RenewDNSBlock = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const RenewDNSButton = styled(Button)`
    margin-bottom: 0.75rem;
`;

const RenewDNSValidUntil = styled(Body2)<{ danger: boolean }>`
    color: ${props => (props.danger ? props.theme.accentRed : props.theme.textSecondary)};
`;

const dnsRenewAmount = new BigNumber(0.02);
const YEAR_MS = 1000 * 60 * 60 * 24 * 366;
const intlOptions = { year: 'numeric', hour: undefined, minute: undefined } as const;

export const RenewNft: FC<{
    nft: NFTDNS;
}> = ({ nft }) => {
    const toast = useToast();
    const isDisabled = useAreNftActionsDisabled(nft);
    const notifyError = useNotification();
    const {
        t,
        i18n: { language }
    } = useTranslation();
    const rtf = new Intl.RelativeTimeFormat(language, { style: 'long' });

    const query = useNftDNSExpirationDate(nft);
    const { data: expirationDate, isLoading: isExpirationInfoLoading } = query;

    const {
        refetch: refetchExpirationInfo,
        isLoading: isWaitingForUpdate,
        isCompleted
    } = useQueryChangeWait(query, (current, prev) => {
        return !!current?.getTime() && current.getTime() !== prev?.getTime();
    });

    useEffect(() => {
        if (isCompleted) {
            toast(t('renew_nft_renewed'));
        }
    }, [isCompleted]);

    const renewUntilFormatted = useDateFormat(Date.now() + YEAR_MS, intlOptions);

    const [isOpen, setIsOpen] = useState(false);
    const onClose = (confirmed?: boolean) => {
        setIsOpen(false);

        if (confirmed) {
            refetchExpirationInfo();
        }
    };

    const { data: jettons } = useWalletJettonList();
    const filter = useUserJettonList(jettons);

    const { recipient, isLoading: isRecipientLoading } = useRecipient(nft.address);

    const {
        isLoading: isFeeLoading,
        data: fee,
        mutate: calculateFee,
        error
    } = useEstimateNftRenew();
    useEffect(() => {
        calculateFee({
            nftAddress: nft.address,
            amount: unShiftedDecimals(dnsRenewAmount)
        });
    }, [nft.address]);
    const amount = useMemo(
        () => ({
            jetton: CryptoCurrency.TON,
            done: false,
            amount: dnsRenewAmount,
            fee: fee!,
            max: false
        }),
        [fee]
    );

    const { mutateAsync: renewMutateAsync, ...renewNftMutation } = useRenewNft();

    const onOpen = () => {
        if (error) {
            notifyError(error as Error);
            return;
        }
        setIsOpen(true);
    };

    if (!isExpirationInfoLoading && !expirationDate) {
        return null;
    }

    const child = () => (
        <ConfirmView
            onClose={onClose}
            recipient={recipient}
            amount={amount}
            jettons={filter}
            fitContent
            mutateAsync={() =>
                renewMutateAsync({
                    nftAddress: nft.address,
                    fee: fee!,
                    amount: unShiftedDecimals(dnsRenewAmount)
                })
            }
            {...renewNftMutation}
        >
            <ConfirmViewButtonsSlot>
                <ConfirmViewButtons withCancelButton />
            </ConfirmViewButtonsSlot>
        </ConfirmView>
    );

    const daysLeft = toDaysLeft(expirationDate);

    return (
        <>
            <RenewDNSBlock>
                <RenewDNSButton
                    type="button"
                    disabled={isDisabled || isWaitingForUpdate}
                    loading={isExpirationInfoLoading || isFeeLoading || isRecipientLoading}
                    onClick={onOpen}
                    size="large"
                    secondary
                    fullWidth
                >
                    {isWaitingForUpdate
                        ? t('renew_nft_in_progress')
                        : t('renew_nft').replace('%1%', renewUntilFormatted)}
                </RenewDNSButton>

                {daysLeft !== '' && (
                    <RenewDNSValidUntil danger={Number(daysLeft) <= 30}>
                        {t('renew_nft_expiration_date').replace(
                            '%1%',
                            rtf.format(Number(daysLeft), 'days')
                        )}
                    </RenewDNSValidUntil>
                )}
            </RenewDNSBlock>
            <Notification isOpen={isOpen} hideButton handleClose={() => onClose} backShadow>
                {child}
            </Notification>
        </>
    );
};
