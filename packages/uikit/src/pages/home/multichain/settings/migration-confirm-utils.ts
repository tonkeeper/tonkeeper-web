import BigNumber from 'bignumber.js';
import { Address } from '@ton/core';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { BasicAsset } from '@tonkeeper/core/dist/entries/crypto/asset/basic-asset';
import {
    TON_ASSET,
    TON_USDT_ASSET,
    TRON_TRX_ASSET,
    TRON_USDT_ASSET
} from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { jettonToTonAssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { MigrationTonVariant } from '@tonkeeper/core/dist/service/migration/migrationService';
import { MigrationTronPlan } from '@tonkeeper/core/dist/service/migration/migrationTronService';
import { isRemainingBalanceMode } from '@tonkeeper/core/dist/service/migration/migrationVerifier';
import { JettonBalance, NftItem } from '@tonkeeper/core/dist/tonApiV2';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { formatAmount } from '@tonkeeper/core/dist/utils/numberFormat';

/**
 * Three significant digits below 1, two truncated decimals from 1 — the moved amounts and their
 * fiat keep their cents at any size, unlike the integer rounding multichain lists apply from 1000.
 */
const formatMigrationValue = (
    value: BigNumber,
    target: { unit?: string; currency?: FiatCurrencies },
    exact = false
) =>
    exact || value.abs().lt(1)
        ? formatAmount(value, { ...target, exact })
        : formatAmount(value.decimalPlaces(2, BigNumber.ROUND_DOWN), { ...target, exact: true });

export const formatMigrationAmount = (
    amount: AssetAmount<BasicAsset>,
    options: { exact?: boolean } = {}
) => formatMigrationValue(amount.relativeAmount, { unit: amount.stringAsset }, options.exact);

export const formatMigrationFiat = (currency: FiatCurrencies, value: BigNumber.Value) =>
    formatMigrationValue(new BigNumber(value), { currency });

/**
 * A required amount next to the balance it exceeds: when display rounding would print the two
 * identically, both are shown exact so the shortage stays visible.
 */
export const formatMigrationShortage = (required: AssetAmount, available: AssetAmount) => {
    const rounded = {
        required: formatMigrationAmount(required),
        available: formatMigrationAmount(available)
    };
    if (rounded.required !== rounded.available || required.weiAmount.eq(available.weiAmount)) {
        return rounded;
    }
    return {
        required: formatMigrationAmount(required, { exact: true }),
        available: formatMigrationAmount(available, { exact: true })
    };
};

export interface MigrationConfirmRowData {
    key: string;
    title: string;
    subtitle: string;
    value: string;
    fiat?: string;
    nft?: NftItem;
}

/** Fiat prices of what the batch moves; a transfer without a price shows no equivalent. */
export interface MigrationRowPricing {
    currency: FiatCurrencies;
    ton?: BigNumber;
    usdt?: BigNumber;
    trx?: BigNumber;
    jetton: (jetton: JettonBalance) => BigNumber | undefined;
}

/** TRON USDT reads as the same USD₮ the TON rows and the rest of the wallet show. */
const TRON_USDT_DISPLAY_ASSET = { ...TRON_USDT_ASSET, symbol: TON_USDT_ASSET.symbol };

/**
 * Rows for the confirmation list, one per verified transfer of the TON
 * batch plus the client-built TRON transfers. Each row names the address
 * its transfer actually pays — never the backend emulation, which comes
 * from the same response as the messages and cannot vouch for them.
 */
export const buildMigrationConfirmRows = ({
    sendLabel,
    nftLabel,
    tonVariant,
    sourceTonBalance,
    tron,
    pricing
}: {
    sendLabel: string;
    nftLabel: string;
    tonVariant?: MigrationTonVariant;
    /** Nanotons on the source, for the estimate of a send-remaining-balance transfer. */
    sourceTonBalance?: BigNumber;
    tron?: MigrationTronPlan;
    pricing?: MigrationRowPricing;
}): MigrationConfirmRowData[] => {
    const rows: MigrationConfirmRowData[] = [];
    const fiatOf = (amount: AssetAmount, price: BigNumber | undefined) =>
        pricing && price
            ? formatMigrationFiat(pricing.currency, amount.relativeAmount.multipliedBy(price))
            : undefined;

    if (tonVariant) {
        let remainingBalance = estimateRemainingBalance(tonVariant, sourceTonBalance);
        tonVariant.verified.forEach((transaction, txIndex) => {
            transaction.transfers.forEach((transfer, transferIndex) => {
                const row = {
                    key: `ton-${txIndex}-${transferIndex}`,
                    title: sendLabel,
                    subtitle: toShortValue(formatAddress(transfer.recipient.toRawString()))
                };
                switch (transfer.type) {
                    case 'ton': {
                        const amount = new AssetAmount({
                            asset: TON_ASSET,
                            weiAmount: transfer.sendsRemainingBalance
                                ? emulatedTonTransferAmount(
                                      tonVariant,
                                      txIndex,
                                      transfer.recipient
                                  ) ?? remainingBalance
                                : transfer.amount.toString()
                        });
                        if (transfer.sendsRemainingBalance) {
                            remainingBalance = new BigNumber(0);
                        }
                        const value = formatMigrationAmount(amount);
                        rows.push({
                            ...row,
                            value: transfer.sendsRemainingBalance ? `≈ ${value}` : value,
                            fiat: fiatOf(amount, pricing?.ton)
                        });
                        return;
                    }
                    case 'jetton': {
                        const amount = jettonToTonAssetAmount({
                            ...transfer.jetton,
                            balance: transfer.amount.toString()
                        });
                        rows.push({
                            ...row,
                            value: formatMigrationAmount(amount),
                            fiat: fiatOf(amount, pricing?.jetton(transfer.jetton))
                        });
                        return;
                    }
                    case 'nft':
                        rows.push({ ...row, value: nftLabel, nft: transfer.nft });
                        return;
                }
            });
        });
    }

    const tronSubtitle = toShortValue(tron?.toAddress ?? '');
    if (tron?.usdtAmount.gt(0)) {
        const amount = new AssetAmount({
            asset: TRON_USDT_DISPLAY_ASSET,
            weiAmount: tron.usdtAmount
        });
        rows.push({
            key: 'tron-usdt',
            title: sendLabel,
            subtitle: tronSubtitle,
            value: formatMigrationAmount(amount),
            fiat: fiatOf(amount, pricing?.usdt)
        });
    }
    if (tron?.trxSweepAmount.gt(0)) {
        const amount = new AssetAmount({ asset: TRON_TRX_ASSET, weiAmount: tron.trxSweepAmount });
        rows.push({
            key: 'tron-trx',
            title: sendLabel,
            subtitle: tronSubtitle,
            value: formatMigrationAmount(amount),
            fiat: fiatOf(amount, pricing?.trx)
        });
    }

    return rows;
};

/**
 * What the backend emulation says a send-remaining-balance message carries.
 * Only the amount is taken from it: the recipient was already verified from
 * the message itself, and the emulation accounts for what the local estimate
 * cannot — excess returned by the jetton transfers, gas Battery covers.
 */
const emulatedTonTransferAmount = (
    tonVariant: MigrationTonVariant,
    txIndex: number,
    recipient: Address
): BigNumber | undefined => {
    const actions = tonVariant.prepared.result.transactions[txIndex]?.emulation.event.actions ?? [];
    for (const action of actions) {
        const transfer = action.tonTransfer;
        if (transfer && Address.parse(transfer.recipient.address).equals(recipient)) {
            return new BigNumber(transfer.amount);
        }
    }
    return undefined;
};

/**
 * Fallback for an emulation without the transfer: a send-remaining-balance
 * message carries whatever is left on chain at
 * execution, so its amount is estimated: the source balance minus every
 * other TON outflow of the batch and the self-paid gas.
 */
const estimateRemainingBalance = (
    tonVariant: MigrationTonVariant,
    sourceTonBalance: BigNumber | undefined
): BigNumber => {
    if (!sourceTonBalance) {
        return new BigNumber(0);
    }
    // Battery funds what its sponsored transactions attach; only self-paid
    // transactions draw on the source balance.
    const otherOutflows = tonVariant.verified.reduce(
        (sum, transaction, index) =>
            tonVariant.prepared.result.transactions[index]?.sponsored
                ? sum
                : transaction.actions.reduce(
                      (acc, { mode, message }) =>
                          message.info.type === 'internal' && !isRemainingBalanceMode(mode)
                              ? acc.plus(message.info.value.coins.toString())
                              : acc,
                      sum
                  ),
        new BigNumber(0)
    );
    return BigNumber.max(sourceTonBalance.minus(otherOutflows).minus(tonVariant.totalGasSpent), 0);
};
