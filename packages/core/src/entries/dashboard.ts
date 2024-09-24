import BigNumber from 'bignumber.js';
import { FiatCurrencies } from './fiat';
import { Address } from '@ton/core';
import { Account } from './account';
import { WalletId, walletVersionText } from './wallet';
import { assertUnreachable } from '../utils/types';

export const columnsTypes = [
    'string',
    'address',
    'numeric',
    'numeric_crypto',
    'numeric_fiat',
    'account_name'
] as const;

export type DashboardColumnType = (typeof columnsTypes)[number];

export function isSupportedColumnType(value: string): value is DashboardColumnType {
    return columnsTypes.includes(value as DashboardColumnType);
}

export type DashboardColumn = {
    id: string;
    name: string;
    description?: string;
    type: (typeof columnsTypes)[number];
    defaultIsChecked: boolean;
    onlyPro: boolean;
};

export type DashboardRow = {
    id: string;
    cells: DashboardCell[];
};

export type DashboardRowNullable = {
    id: string;
    cells: (DashboardCell | null)[];
};

export type DashboardCell =
    | DashboardCellAccountName
    | DashboardCellString
    | DashboardCellAddress
    | DashboardCellNumeric
    | DashboardCellNumericCrypto
    | DashboardCellNumericFiat;

export type DashboardCellString = {
    columnId: string;
    type: 'string';
    value: string;
};

export type DashboardCellAccountName = {
    columnId: string;
    type: 'account_name';
    account: Account;
    walletId: WalletId;
};

export type DashboardCellAddress = {
    columnId: string;
    type: 'address';
    raw: string;
};

export type DashboardCellNumeric = {
    columnId: string;
    type: 'numeric';
    value: string;
    decimalPlaces?: number;
};

export type DashboardCellNumericCrypto = {
    columnId: string;
    type: 'numeric_crypto';
    value: BigNumber;
    decimals: number;
    symbol: string;
};

export type DashboardCellNumericFiat = {
    columnId: string;
    type: 'numeric_fiat';
    value: BigNumber;
    fiat: FiatCurrencies;
};

export function toStringDashboardCell(cell: DashboardCell): string {
    switch (cell.type) {
        case 'account_name':
            return accountAndWalletToString(cell.account, cell.walletId);
        case 'string':
            return cell.value;
        case 'address':
            return Address.parse(cell.raw).toString();
        case 'numeric':
            return cell.value;
        case 'numeric_crypto':
            return cell.value.div(10 ** cell.decimals).toString() + ' ' + cell.symbol;
        case 'numeric_fiat':
            return cell.value.toString() + ' ' + cell.fiat;
    }
}

function accountAndWalletToString(account: Account, walletId: WalletId): string {
    const baseInfo = account.name + ' ' + account.emoji;

    switch (account.type) {
        case 'watch-only':
            return baseInfo + ' (watch only)';
        case 'ledger':
            const index = account.derivations.find(d =>
                d.tonWallets.some(w => w.id === walletId)
            )?.index;
            if (index === undefined) {
                return baseInfo;
            }

            return baseInfo + ' [' + (index + 1).toString() + ']';
        case 'mam':
            const derivation = account.derivations.find(d =>
                d.tonWallets.some(w => w.id === walletId)
            );
            if (derivation === undefined) {
                return baseInfo;
            }

            return (
                derivation.name +
                ' ' +
                derivation.emoji +
                ' [' +
                (derivation.index + 1).toString() +
                ']'
            );
        case 'ton-only':
        case 'mnemonic':
            if (account.allTonWallets.length === 1) {
                return baseInfo;
            }

            const walletVersion = account.getTonWallet(walletId)?.version;
            if (walletVersion === undefined) {
                return baseInfo;
            }

            return baseInfo + ' ' + walletVersionText(walletVersion);
        case 'keystone':
            return baseInfo;
        case 'ton-multisig':
            return baseInfo + ' ' + 'multisig';
    }

    assertUnreachable(account);
}
