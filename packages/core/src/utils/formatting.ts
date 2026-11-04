import { getNumberSeparators } from './numberFormat';

export const getDecimalSeparator = () => getNumberSeparators().decimalSeparator;

export const getNotDecimalSeparator = () => {
    const separator = getDecimalSeparator();
    return { '.': ',', ',': '.' }[separator] as string;
};

export const getGroupSeparator = () => getNumberSeparators().groupingSeparator;
