import BigNumber from 'bignumber.js';
import { JettonsBalances } from '../tonApiV2';
import { getBrowserLocale, getDecimalSeparator, getGroupSeparator } from './formatting';

export const DefaultDecimals = 9;

export function removeGroupSeparator(str: string): string {
    return str.replaceAll(getGroupSeparator(), '');
}

export function toNumberAmount(str: string): number {
    return parseFloat(str.replace(',', '.'));
}
export function isNumeric(str: string) {
    const [entry, tail] = removeGroupSeparator(str.trim()).split(getDecimalSeparator());

    return /^[0-9]+$/.test(entry) && (!tail || /^[0-9]+$/.test(tail));
}

export function seeIfLargeTail(str: string, decimals: number) {
    const [, tail] = removeGroupSeparator(str.trim()).split(getDecimalSeparator());
    if (tail && tail.length > decimals) return true;
    return false;
}

export function cropTail(str: string, decimals: number) {
    const [entry, tail] = removeGroupSeparator(str.trim()).split(getDecimalSeparator());
    if (tail && tail.length > decimals) {
        return formatEntryAndTail(entry, decimals > 0 ? tail.slice(0, decimals) : undefined);
    }
    return str;
}

export function getDecimalLength(str: string) {
    const [, tail] = removeGroupSeparator(str.trim()).split(getDecimalSeparator());
    return tail ? tail.length : 0;
}

function formatEntryAndTail(entry: string, tail: string | undefined) {
    const path = [] as string[];
    path.push(new Intl.NumberFormat(getBrowserLocale()).format(parseInt(entry)));
    if (tail !== undefined) {
        path.push(tail);
    }
    return path.join(getDecimalSeparator());
}
export function formatNumberValue(value: BigNumber) {
    const [entry, tail] = value.toFormat({ decimalSeparator: '.', groupSeparator: '' }).split('.');
    return formatEntryAndTail(entry, tail);
}

export function formatSendValue(str: string) {
    const [entry, tail] = removeGroupSeparator(str.trim()).split(getDecimalSeparator());
    return formatEntryAndTail(entry, tail);
}

export const getJettonSymbol = (address: string, jettons: JettonsBalances): string => {
    const jetton = jettons.balances.find(item => item.jetton.address === address);
    return jetton?.jetton.symbol ?? address;
};
