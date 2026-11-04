import { FC, useState } from 'react';
import BigNumber from 'bignumber.js';

import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';

import { Button, Input } from '../../../../primitives';
import { Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives/Modal';
import { SendAddressField } from '../../../../components/transfer/multichain/SendAddressField';
import {
    AssetIcon,
    RecipientValue
} from '../../../../components/transfer/multichain/multichainSendShared';
import { NetworkFeeValue } from '../../../../components/transfer/multichain/NetworkFeeValue';
import {
    FeeMethodBatteryIcon,
    SendFeeMethodSheet
} from '../../../../components/transfer/multichain/SendFeeMethodSheet';
import {
    useFeeTextFormatter,
    useLeaveForAddFunds,
    useNativeAsset
} from '../../../../components/transfer/multichain/SendConfirmShell';
import IcBatteryFlash44 from '../../../../icons/components/IcBatteryFlash44';
import { BatteryModal } from '../battery/BatteryModal';
import { MultichainDetailCell } from '../MultichainDetailCell';
import { useTranslation } from '../../../../hooks/translation';
import { useEstimateNftTransfer } from '../../../../hooks/blockchain/nft/useEstimateNftTransfer';
import { useTransferNft } from '../../../../hooks/blockchain/nft/useTransferNft';
import { useTonRecipientResolution } from '../../../../state/multichain/transfer/useTonRecipientResolution';
import { useActiveAccount, useActiveTonNetwork } from '../../../../state/wallet';
import { NftActionConfirmSheet, NftActionWalletCell } from './MultichainNftActionConfirm';
import { NFT_BURN_ADDRESS, nftPreviewImage } from './nft-utils';

// The wallet's coin row is absent while it holds no coins (the backend hides
// zero balances), which is exactly when the coin row needs "Add Funds".
const TON_COIN_ASSET_ID = 'ton/mainnet/coin';

interface TransferTarget {
    toAddress: string;
    domain?: string;
    comment: string;
}

/**
 * Recipient step of the NFT transfer: a TON address or name-service domain
 * plus an optional comment. Resolution runs through tonapi so domains
 * resolve and backend-flagged scam recipients are blocked before the
 * confirm step. Some exchange deposit addresses require a memo — when
 * tonapi flags the recipient, an empty comment blocks Continue.
 */
const NftTransferRecipientSheet: FC<{
    isOpen: boolean;
    nftName: string;
    initial?: TransferTarget & { input: string };
    onClose: () => void;
    onContinue: (target: TransferTarget & { input: string }) => void;
}> = ({ isOpen, nftName, initial, onClose, onContinue }) => {
    const { t } = useTranslation();
    const [address, setAddress] = useState(initial?.input ?? '');
    const [comment, setComment] = useState(initial?.comment ?? '');
    // The address error surfaces once the field has lost focus and clears
    // only when the value changes, so it doesn't flicker on re-focus.
    const [touched, setTouched] = useState(false);

    const resolution = useTonRecipientResolution(address);

    const onAddressChange = (value: string) => {
        setAddress(value);
        setTouched(false);
    };

    const onPaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) onAddressChange(text.trim());
        } catch {
            /* clipboard unavailable / denied */
        }
    };

    const memoMissing =
        resolution.status === 'valid' && resolution.memoRequired && comment.trim() === '';
    const canContinue = resolution.status === 'valid' && !memoMissing;

    const addressError =
        resolution.status === 'scam'
            ? t('send_address_blacklisted')
            : touched && resolution.status === 'invalid'
            ? t('send_address_error')
            : undefined;

    const submit = () => {
        if (resolution.status !== 'valid') return;
        onContinue({
            input: address,
            toAddress: resolution.toAddress,
            domain: resolution.domain,
            comment: comment.trim()
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            topBarTitle={t('nft_transfer_title')}
            variant="content"
            mobileHeight="full"
        >
            <div className="flex flex-col gap-4 pb-4">
                <p className="text-body2 text-textSecondary">{nftName}</p>
                <SendAddressField
                    value={address}
                    onChange={onAddressChange}
                    onClear={() => onAddressChange('')}
                    onPaste={onPaste}
                    onBlur={() => setTouched(true)}
                    error={addressError}
                />
                <div className="flex flex-col">
                    <Input
                        id="nft-transfer-comment"
                        value={comment}
                        onChange={setComment}
                        label={t('send_comment')}
                    />
                    {comment.trim() !== '' && (
                        <p className="px-0.5 pt-2 text-body2 text-textSecondary">
                            {t('send_comment_visible_hint')}
                        </p>
                    )}
                </div>
            </div>

            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        variant="primaryBlue"
                        size="large"
                        fullWidth
                        disabled={!canContinue}
                        loading={resolution.status === 'resolving'}
                        onClick={submit}
                    >
                        {t('continue')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </Modal>
    );
};

const NftTransferConfirmSheet: FC<{
    nft: NFT;
    nftName: string;
    target: TransferTarget | undefined;
    isOpen: boolean;
    onBack?: () => void;
    onClose: (confirmed?: boolean) => void;
    title?: string;
    confirmLabel?: string;
}> = ({ nft, nftName, target, isOpen, onBack, onClose, title, confirmLabel }) => {
    const { t } = useTranslation();
    const account = useActiveAccount();
    const network = useActiveTonNetwork();

    const params = target
        ? {
              nftAddress: nft.address,
              recipientAddress: target.toAddress,
              comment: target.comment || undefined
          }
        : undefined;
    const nativeTon = useNativeAsset('ton');
    const fee = useEstimateNftTransfer(
        params,
        nativeTon ? new BigNumber(nativeTon.balance) : undefined
    );
    const selected = fee.selected?.estimation
        ? { method: fee.selected.method, estimation: fee.selected.estimation }
        : undefined;
    const mutation = useTransferNft(params, selected);
    const recipientAddress = target ? formatAddress(target.toAddress, network) : undefined;

    const [feeSheetOpen, setFeeSheetOpen] = useState(false);
    const [batteryOpen, setBatteryOpen] = useState(false);
    const feeText = useFeeTextFormatter();
    const addFunds = useLeaveForAddFunds(() => onClose());

    const selectedFee = fee.selected?.estimation
        ? feeText(fee.selected.estimation.fee, fee.selected.estimation.event?.extra)
        : undefined;
    const feeDescription = fee.selected?.insufficient ? (
        <span className="text-accentRed">
            {fee.selected.method.type === 'external'
                ? t('multichain_swap_insufficient_fee_token', { symbol: TON_ASSET.symbol })
                : t('send_screen_steps_amount_insufficient_balance')}
        </span>
    ) : fee.canPick ? undefined : (
        selectedFee?.fiatText && `≈ ${selectedFee.fiatText}`
    );
    // As on iOS, opening the picker re-prices the methods that failed to
    // price, so a transient failure only hides a method until the next open.
    const openFeePicker = () => {
        fee.estimates.filter(e => e.isError).forEach(e => e.refetch());
        setFeeSheetOpen(true);
    };
    const feeOptions = fee.usable.map(estimate => {
        const battery = estimate.method.type === 'battery';
        return {
            key: estimate.method.type,
            icon: battery ? (
                <FeeMethodBatteryIcon>
                    <IcBatteryFlash44 />
                </FeeMethodBatteryIcon>
            ) : nativeTon ? (
                <AssetIcon asset={nativeTon} size={44} withChainBadge={false} />
            ) : (
                <img
                    src={TON_ASSET.image}
                    alt=""
                    className="size-11 rounded-full bg-backgroundContent object-cover"
                />
            ),
            title: battery ? t('battery_title') : TON_ASSET.symbol,
            disabled: estimate.insufficient,
            // The battery screen stacks over the confirm, so the typed
            // transfer survives a recharge; the estimates re-price on
            // return. Adding funds leaves for the home flow instead.
            action: !estimate.insufficient
                ? undefined
                : battery
                ? {
                      label: t('battery_recharge_by_crypto_title'),
                      onClick: () => setBatteryOpen(true)
                  }
                : {
                      label: t('wallet_add_funds'),
                      onClick: () => addFunds(nativeTon?.assetId ?? TON_COIN_ASSET_ID)
                  }
        };
    });

    return (
        <NftActionConfirmSheet
            isOpen={isOpen}
            onClose={onClose}
            onBack={onBack}
            title={title ?? t('nft_transfer_title')}
            confirmLabel={confirmLabel ?? t('nft_transfer_nft')}
            image={nftPreviewImage(nft)}
            imageAlt={nftName}
            estimation={{
                isFetching: fee.pending,
                isError: fee.allFailed,
                data: fee.selected?.insufficient ? undefined : fee.selected?.estimation
            }}
            mutation={mutation}
            rows={
                <>
                    <NftActionWalletCell emoji={account.emoji} name={account.name} />
                    <MultichainDetailCell
                        label={t('send_confirm_recipient')}
                        value={
                            target?.domain ??
                            (recipientAddress ? <RecipientValue address={recipientAddress} /> : '')
                        }
                        sub={
                            target?.domain ? (
                                <span className="break-all">{recipientAddress}</span>
                            ) : undefined
                        }
                    />
                    {target?.comment && (
                        <MultichainDetailCell label={t('send_comment')} value={target.comment} />
                    )}
                    <MultichainDetailCell
                        label={fee.canPick ? t('send_network_fee') : t('transaction_fee')}
                        value={
                            <NetworkFeeValue
                                loading={!fee.allFailed && (fee.pending || !fee.selected)}
                                error={fee.allFailed}
                                onRetry={fee.refetchAll}
                                value={fee.canPick ? selectedFee?.row.value : selectedFee?.amount}
                                unit={fee.canPick ? selectedFee?.row.unit : undefined}
                                onChange={
                                    fee.canPick && !mutation.isLoading && !mutation.isSuccess
                                        ? openFeePicker
                                        : undefined
                                }
                            />
                        }
                        sub={feeDescription || undefined}
                        last
                    />
                </>
            }
        >
            <SendFeeMethodSheet
                isOpen={isOpen && feeSheetOpen}
                onClose={() => setFeeSheetOpen(false)}
                options={feeOptions}
                selected={fee.selectedType}
                onSelect={fee.setSelectedType}
            />
            <BatteryModal
                isOpen={isOpen && batteryOpen}
                onClose={() => setBatteryOpen(false)}
                afterClose={fee.refetchAll}
                from="wallet"
                layered
            />
        </NftActionConfirmSheet>
    );
};

/**
 * Two-step NFT transfer for the multichain NFT details sheet: recipient,
 * then confirm. Both steps are modals of their own so the confirm step can
 * navigate back into the recipient step with the typed values intact.
 */
export const MultichainNftTransferSheet: FC<{
    nft: NFT;
    isOpen: boolean;
    onClose: (transferred?: boolean) => void;
    mode?: 'transfer' | 'burn';
}> = ({ nft, isOpen, onClose, mode = 'transfer' }) => {
    const { t } = useTranslation();
    const network = useActiveTonNetwork();
    const [step, setStep] = useState<'recipient' | 'confirm'>('recipient');
    const [target, setTarget] = useState<(TransferTarget & { input: string }) | undefined>();

    const nftName = nft.metadata?.name ?? toShortValue(formatAddress(nft.address, network, true));
    const isBurn = mode === 'burn';
    // Keep the target undefined while the burn sheet is closed, otherwise its
    // estimation hook would perform a background request for an invisible UI.
    const effectiveTarget: TransferTarget | undefined =
        isBurn && isOpen
            ? { toAddress: NFT_BURN_ADDRESS, comment: '' }
            : isBurn
            ? undefined
            : target;

    const close = (transferred?: boolean) => {
        setStep('recipient');
        setTarget(undefined);
        onClose(transferred);
    };

    return (
        <>
            <NftTransferRecipientSheet
                key={isOpen ? 'open' : 'closed'}
                isOpen={isOpen && !isBurn && step === 'recipient'}
                nftName={nftName}
                initial={target}
                onClose={() => close()}
                onContinue={next => {
                    setTarget(next);
                    setStep('confirm');
                }}
            />
            <NftTransferConfirmSheet
                nft={nft}
                nftName={nftName}
                target={effectiveTarget}
                isOpen={isOpen && (isBurn || step === 'confirm')}
                onBack={isBurn ? undefined : () => setStep('recipient')}
                onClose={close}
                title={isBurn ? t('multichain_nft_burn') : undefined}
                confirmLabel={isBurn ? t('multichain_nft_burn') : undefined}
            />
        </>
    );
};
