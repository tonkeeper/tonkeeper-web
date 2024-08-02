import styled from 'styled-components';
import { hexToRGBA } from '../../../../libs/css';
import { useTranslation } from '../../../../hooks/translation';
import { ArrowDownIcon, ArrowUpIcon, XMarkCircleIcon } from '../../../Icon';
import { FC, ReactNode } from 'react';
import { Body2, Body2Class } from '../../../Text';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { useFormatCoinValue } from '../../../../hooks/balance';
import { HistoryGridCell, HistoryGridCellFillRow } from './HistoryGrid';
import { useActiveTonNetwork, useActiveWallet } from '../../../../state/wallet';

export const HistoryCellAction = styled(HistoryGridCell)`
    display: flex;
    gap: 6px;
    height: 20px;
    align-items: center;
`;

const ArrowDownIconStyled = styled(ArrowDownIcon)`
    color: ${p => p.theme.iconPrimary};
`;

const ArrowUpIconStyled = styled(ArrowUpIcon)`
    color: ${p => p.theme.iconPrimary};
`;

export const HistoryCellActionGeneric: FC<{
    icon: ReactNode;
    children: ReactNode;
    isFailed: boolean;
}> = ({ icon, children, isFailed }) => {
    return (
        <HistoryCellAction>
            {isFailed ? <XMarkCircleIcon color="accentRed" /> : icon}
            <Body2>{children}</Body2>
            {isFailed && <HistoryBadgeFailed />}
        </HistoryCellAction>
    );
};

export const HistoryCellActionReceived: FC<{
    isScam: boolean;
    isFailed: boolean;
}> = ({ isScam, isFailed }) => {
    const { t } = useTranslation();
    return (
        <HistoryCellAction>
            {isFailed ? <XMarkCircleIcon color="accentRed" /> : <ArrowDownIconStyled />}
            <Body2>{isScam ? t('spam_action') : t('transaction_type_receive')}</Body2>
            {isScam && !isFailed && <HistoryBadgeScam />}
            {isFailed && <HistoryBadgeFailed />}
        </HistoryCellAction>
    );
};

export const HistoryCellActionSent: FC<{
    isFailed: boolean;
}> = ({ isFailed }) => {
    const { t } = useTranslation();
    return (
        <HistoryCellAction>
            {isFailed ? <XMarkCircleIcon color="accentRed" /> : <ArrowUpIconStyled />}
            <Body2>{t('transaction_type_sent')}</Body2>
            {isFailed && <HistoryBadgeFailed />}
        </HistoryCellAction>
    );
};

export const HistoryBadge = styled.div<{ color: string }>`
    padding: 2px 4px;
    color: ${p => p.theme[p.color]};
    border-radius: ${p => p.theme.corner3xSmall};
    background-color: ${p => hexToRGBA(p.theme[p.color], 0.16)};
    text-transform: uppercase;

    font-style: normal;
    font-size: 8.5px;
    font-weight: 510;
    line-height: 12px;
    height: fit-content;
`;

export const HistoryBadgeFailed = () => {
    const { t } = useTranslation();
    return <HistoryBadge color="accentRed">{t('transactions_failed')}</HistoryBadge>;
};

export const HistoryBadgeScam = () => {
    const { t } = useTranslation();
    return <HistoryBadge color="accentOrange">{t('transactions_spam')}</HistoryBadge>;
};

const HistoryCellAccountStyled = styled(HistoryGridCell)`
    ${Body2Class};

    color: ${p => p.theme.textSecondary};
    font-family: ${p => p.theme.fontMono};
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
`;
export const HistoryCellAccount: FC<{
    account?: { address?: string; name?: string };
    fallbackAddress?: string;
}> = ({ account, fallbackAddress }) => {
    const network = useActiveTonNetwork();
    const { t } = useTranslation();

    return (
        <HistoryCellAccountStyled>
            {account?.name
                ? account.name
                : account?.address
                ? toShortValue(formatAddress(account.address, network))
                : fallbackAddress
                ? toShortValue(formatAddress(fallbackAddress, network))
                : t('transactions_unknown')}
        </HistoryCellAccountStyled>
    );
};

const HistoryCellCommentStyled = styled(Body2)`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 40px;
`;

export const HistoryCellComment: FC<{ comment?: string; isScam?: boolean; className?: string }> = ({
    comment,
    isScam,
    className
}) => {
    if (!comment || isScam) {
        return <div />;
    }
    return <HistoryCellCommentStyled className={className}>{comment}</HistoryCellCommentStyled>;
};

export const HistoryCellCommentSecondary = styled(HistoryCellComment)`
    color: ${p => p.theme.textSecondary};
`;

const HistoryCellAmountStyled = styled(Body2)<{ color?: string }>`
    color: ${p => (p.color ? p.theme[p.color] : p.theme.textPrimary)};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const HistoryCellAmount: FC<{
    amount: string | number;
    symbol: string;
    decimals: number;
    color?: string;
    isNegative?: boolean;
    isFailed?: boolean;
    isSpam?: boolean;
}> = ({ amount, symbol, decimals, color, isNegative, isFailed, isSpam }) => {
    const format = useFormatCoinValue();

    const finalColor = color
        ? color
        : isSpam
        ? 'accentRed'
        : isFailed
        ? 'textTertiary'
        : !isNegative
        ? 'accentGreen'
        : 'textPrimary';

    return (
        <HistoryCellAmountStyled color={finalColor}>
            {isNegative ? '−' : '+'}&nbsp;
            {format(amount, decimals)}&nbsp;{symbol}
        </HistoryCellAmountStyled>
    );
};

export const HistoryCellAmountText = styled(HistoryGridCell)`
    ${Body2Class};
    color: ${p => p.theme.textTertiary};
`;

export const ActionRow = styled(HistoryGridCell)`
    display: grid;
    gap: 0.5rem;
    grid-template-columns: 1fr max-content;
`;

export const ErrorRow: FC<{ children?: ReactNode }> = ({ children }) => {
    return (
        <>
            <HistoryGridCellFillRow>
                <Body2 color="textTertiary">{children || 'Unknown error'}</Body2>
            </HistoryGridCellFillRow>
        </>
    );
};
