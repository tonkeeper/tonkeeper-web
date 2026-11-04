import { FC, ReactNode, useEffect, useState } from 'react';

import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { intlDateLocale } from '@tonkeeper/core/dist/entries/language';
import { NFTDNS } from '@tonkeeper/core/dist/entries/nft';

import { Button } from '../../../../primitives';
import { cn } from '../../../../libs/css';
import { MultichainDetailCell } from '../MultichainDetailCell';
import { useAppContext } from '../../../../hooks/appContext';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { toDaysLeft, useDateFormat } from '../../../../hooks/dateFormat';
import { useTranslation } from '../../../../hooks/translation';
import { useNotifyErrorHandle, useToast } from '../../../../hooks/useNotification';
import { useQueryChangeWait } from '../../../../hooks/useQueryChangeWait';
import { useAreNftActionsDisabled } from '../../../../hooks/blockchain/nft/useAreNftActionsDisabled';
import { useEstimateNftRenew } from '../../../../hooks/blockchain/nft/useEstimateNftRenew';
import { useRenewNft } from '../../../../hooks/blockchain/nft/useRenewNft';
import { useAssetAmountFiatEquivalent } from '../../../../state/asset';
import { useNftDNSExpirationDate } from '../../../../state/nft';
import { useActiveAccount } from '../../../../state/wallet';
import {
    NftActionConfirmSheet,
    NftActionConfirmView,
    NftActionFeeCell,
    NftActionWalletCell
} from './MultichainNftActionConfirm';
import { nftPreviewImage } from './nft-utils';

// Must match `NFTEncoder.nftRenewAmount` — the value actually attached to
// the renew message.
const RENEW_ASSET_AMOUNT = AssetAmount.fromRelativeAmount({ asset: TON_ASSET, amount: 0.02 });
// The DNS item contract extends the expiry by a 366-day year — tonapi's
// `expiring_at` and dns.ton.org land one day past the calendar anniversary.
const YEAR_MS = 1000 * 60 * 60 * 24 * 366;
const EXPIRATION_DANGER_DAYS = 30;

/**
 * Renew button with the expiration caption. Pure — `MultichainNftRenewSection`
 * wires the data hooks around it.
 */
export const NftRenewSectionView: FC<{
    renewUntilFormatted: string;
    daysLeft?: number;
    loading?: boolean;
    disabled?: boolean;
    inProgress?: boolean;
    onRenew: () => void;
}> = ({ renewUntilFormatted, daysLeft, loading, disabled, inProgress, onRenew }) => {
    const {
        t,
        i18n: { language }
    } = useTranslation();
    const rtf = new Intl.RelativeTimeFormat(intlDateLocale(language), { style: 'long' });

    return (
        <div className="flex flex-col items-center gap-3">
            <Button
                variant="secondary"
                size="large"
                fullWidth
                loading={loading}
                disabled={disabled || inProgress}
                onClick={onRenew}
            >
                {inProgress
                    ? t('renew_nft_in_progress')
                    : t('dns_renew_until_btn', { untilDate: renewUntilFormatted })}
            </Button>
            {daysLeft !== undefined && (
                <span
                    className={cn(
                        'text-body2',
                        daysLeft <= EXPIRATION_DANGER_DAYS ? 'text-accentRed' : 'text-textSecondary'
                    )}
                >
                    {t('renew_nft_expiration_date').replace('%1%', rtf.format(daysLeft, 'days'))}
                </span>
            )}
        </div>
    );
};

/**
 * Presentational body of the renew confirm sheet: domain hero, the wallet /
 * recipient / amount / fee table, and the action slot. Pure — every value is
 * a prop, so it renders identically in a screenshot as in the app.
 */
export const NftRenewConfirmView: FC<{
    domain: string;
    image?: string;
    accountEmoji?: string;
    accountName: string;
    amount: string;
    amountFiat?: string;
    fee: ReactNode;
    feeSub?: ReactNode;
    error?: string;
    action: ReactNode;
}> = ({
    domain,
    image,
    accountEmoji,
    accountName,
    amount,
    amountFiat,
    fee,
    feeSub,
    error,
    action
}) => {
    const { t } = useTranslation();

    return (
        <NftActionConfirmView
            title={t('dns_renew_title')}
            image={image}
            imageAlt={domain}
            error={error}
            action={action}
            rows={
                <>
                    <NftActionWalletCell emoji={accountEmoji} name={accountName} />
                    <MultichainDetailCell label={t('send_confirm_recipient')} value={domain} />
                    <MultichainDetailCell
                        label={t('send_amount')}
                        value={amount}
                        sub={amountFiat}
                    />
                    <MultichainDetailCell
                        label={t('transaction_fee')}
                        value={fee}
                        sub={feeSub}
                        last
                    />
                </>
            }
        />
    );
};

const NftRenewConfirmSheet: FC<{
    nft: NFTDNS;
    isOpen: boolean;
    onClose: (confirmed?: boolean) => void;
    estimation: ReturnType<typeof useEstimateNftRenew>;
}> = ({ nft, isOpen, onClose, estimation }) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const account = useActiveAccount();
    const send = useRenewNft({ nftAddress: nft.address });
    const { data: amountFiatBN } = useAssetAmountFiatEquivalent(RENEW_ASSET_AMOUNT);

    return (
        <NftActionConfirmSheet
            isOpen={isOpen}
            onClose={onClose}
            title={t('dns_renew_title')}
            image={nftPreviewImage(nft)}
            imageAlt={nft.dns}
            estimation={estimation}
            mutation={send}
            rows={
                <>
                    <NftActionWalletCell emoji={account.emoji} name={account.name} />
                    <MultichainDetailCell label={t('send_confirm_recipient')} value={nft.dns} />
                    <MultichainDetailCell
                        label={t('send_amount')}
                        value={RENEW_ASSET_AMOUNT.stringAssetRelativeAmount}
                        sub={amountFiatBN ? formatFiatCurrency(fiat, amountFiatBN) : undefined}
                    />
                    <NftActionFeeCell estimation={estimation} />
                </>
            }
        />
    );
};

/**
 * .ton domain renewal for the multichain NFT details sheet: the renew
 * button with the expiration caption, and the confirm sheet it opens.
 * Hidden while the domain has no readable expiration date (not a claimed
 * TON DNS domain). After a confirmed renew it polls the expiration date
 * until the chain reflects the new period, then toasts.
 */
export const MultichainNftRenewSection: FC<{ nft: NFTDNS }> = ({ nft }) => {
    const { t } = useTranslation();
    const toast = useToast();
    const notifyError = useNotifyErrorHandle();
    const isDisabled = useAreNftActionsDisabled(nft);

    const query = useNftDNSExpirationDate(nft);
    const { data: expirationDate, isLoading: isExpirationLoading } = query;

    const {
        refetch: waitExpirationUpdate,
        isLoading: isWaitingForUpdate,
        isCompleted
    } = useQueryChangeWait(
        query,
        (current, prev) => !!current?.getTime() && current.getTime() !== prev?.getTime()
    );

    useEffect(() => {
        if (isCompleted) {
            toast(t('renew_nft_renewed'));
        }
    }, [isCompleted, toast, t]);

    const renewUntilFormatted = useDateFormat(Date.now() + YEAR_MS, {
        year: 'numeric',
        hour: undefined,
        minute: undefined
    });

    const estimation = useEstimateNftRenew({ nftAddress: nft.address });

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const onOpen = () => {
        if (estimation.error) {
            notifyError(estimation.error as Error);
            return;
        }
        setIsConfirmOpen(true);
    };

    const onCloseConfirm = (confirmed?: boolean) => {
        setIsConfirmOpen(false);
        if (confirmed) {
            waitExpirationUpdate();
        }
    };

    if (!isExpirationLoading && !expirationDate) {
        return null;
    }

    const daysLeft = toDaysLeft(expirationDate);

    return (
        <>
            <NftRenewSectionView
                renewUntilFormatted={renewUntilFormatted}
                daysLeft={daysLeft === '' ? undefined : Number(daysLeft)}
                loading={isExpirationLoading || estimation.isFetching}
                disabled={isDisabled}
                inProgress={isWaitingForUpdate}
                onRenew={onOpen}
            />
            <NftRenewConfirmSheet
                nft={nft}
                isOpen={isConfirmOpen}
                onClose={onCloseConfirm}
                estimation={estimation}
            />
        </>
    );
};
