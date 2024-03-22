import styled from 'styled-components';
import { hexToRGBA } from '../../../../libs/css';
import { useTranslation } from '../../../../hooks/translation';
import { ArrowDownIcon, ArrowUpIcon, XMarkCircleIcon } from '../../../Icon';
import { FC, ReactNode } from 'react';
import { Body2 } from '../../../Text';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { useFormatCoinValue } from '../../../../hooks/balance';
import { useWalletContext } from '../../../../hooks/appContext';

export const HistoryCellAction = styled.div`
    display: flex;
    gap: 6px;
    height: 20px;
    align-items: center;
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
            {isFailed ? <XMarkCircleIcon color="accentRed" /> : <ArrowDownIcon />}
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
            {isFailed ? <XMarkCircleIcon color="accentRed" /> : <ArrowUpIcon />}
            {t('transaction_type_sent')}
            {isFailed && <HistoryBadgeFailed />}
        </HistoryCellAction>
    );
};

export const HistoryBadge = styled.div<{ color: string }>`
    padding: 2px 4px;
    color: ${p => p.theme[p.color]};
    border-radius: ${p => p.theme.corner2xSmall};
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

const HistoryCellAccountStyled = styled(Body2)`
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
    const wallet = useWalletContext();
    const { t } = useTranslation();

    return account?.name ? (
        <HistoryCellAccountStyled>{account.name}</HistoryCellAccountStyled>
    ) : account?.address ? (
        <HistoryCellAccountStyled>
            {toShortValue(formatAddress(account.address, wallet.network))}
        </HistoryCellAccountStyled>
    ) : fallbackAddress ? (
        <HistoryCellAccountStyled>
            {toShortValue(formatAddress(fallbackAddress, wallet.network))}
        </HistoryCellAccountStyled>
    ) : (
        <HistoryCellAccountStyled>{t('transactions_unknown')}</HistoryCellAccountStyled>
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
            {isNegative ? '−' : '+'}
            {format(amount, decimals)}&nbsp;{symbol}
        </HistoryCellAmountStyled>
    );
};

export const ActionRow = styled.div`
    display: grid;
    gap: 0.5rem;
    grid-template-columns: 132px 116px 1fr max-content;
`;

export const ErrorRow = () => {
    return <Body2 color="textTertiary">Unknown error</Body2>;
};
