import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { intlLocale } from '@tonkeeper/core/dist/entries/language';
import { NFTDNS } from '@tonkeeper/core/dist/entries/nft';
import { TransferEstimationEvent } from '@tonkeeper/core/dist/entries/send';
import { unShiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import BigNumber from 'bignumber.js';
import { FC, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useToast } from '../../hooks/appSdk';
import { useAreNftActionsDisabled } from '../../hooks/blockchain/nft/useAreNftActionsDisabled';
import { useEstimateNftRenew } from '../../hooks/blockchain/nft/useEstimateNftRenew';
import { useRenewNft } from '../../hooks/blockchain/nft/useRenewNft';
import { useTonRecipient } from '../../hooks/blockchain/useTonRecipient';
import { toDaysLeft, useDateFormat } from '../../hooks/dateFormat';
import { useTranslation } from '../../hooks/translation';
import { useNotification } from '../../hooks/useNotification';
import { useQueryChangeWait } from '../../hooks/useQueryChangeWait';
import { Notification } from '../Notification';
import { Body2 } from '../Text';
import { Button } from '../fields/Button';
import { ConfirmView, ConfirmViewButtons, ConfirmViewButtonsSlot } from '../transfer/ConfirmView';
import { ConfirmAndCancelMainButton } from '../transfer/common';
import { useNftDNSExpirationDate } from "../../state/nft";

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
const dnsRenewAssetAmount = AssetAmount.fromRelativeAmount({
    asset: TON_ASSET,
    amount: new BigNumber(0.02)
});
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
    const rtf = new Intl.RelativeTimeFormat(intlLocale(language), { style: 'long' });

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

    const { recipient, isLoading: isRecipientLoading } = useTonRecipient(nft.address);

    const estimation = useEstimateNftRenew({
        nftAddress: nft.address,
        amount: unShiftedDecimals(dnsRenewAmount)
    });

    const mutation = useRenewNft({
        nftAddress: nft.address,
        amount: unShiftedDecimals(dnsRenewAmount),
        fee: estimation.data?.payload as TransferEstimationEvent
    });

    const onOpen = () => {
        if (estimation.error) {
            notifyError(estimation.error as Error);
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
            assetAmount={dnsRenewAssetAmount}
            fitContent
            estimation={estimation}
            {...mutation}
        >
            <ConfirmViewButtonsSlot>
                <ConfirmViewButtons MainButton={ConfirmAndCancelMainButton} />
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
                    loading={isExpirationInfoLoading || estimation.isFetching || isRecipientLoading}
                    onClick={onOpen}
                    size="large"
                    secondary
                    fullWidth
                >
                    {isWaitingForUpdate
                        ? t('renew_nft_in_progress')
                        : t('dns_renew_until_btn').replace('%{untilDate}', renewUntilFormatted)}
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
