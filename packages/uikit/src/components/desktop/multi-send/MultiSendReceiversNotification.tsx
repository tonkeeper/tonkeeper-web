import { FC } from 'react';
import { Notification } from '../../Notification';
import styled, { createGlobalStyle } from 'styled-components';
import { Body2 } from '../../Text';
import { formatAddress } from '@tonkeeper/core/dist/utils/common';
import { MultiSendFormTokenized } from '../../../hooks/blockchain/useSendMultiTransfer';
import { formatFiatCurrency, formatter } from '../../../hooks/balance';
import { useAppContext } from '../../../hooks/appContext';
import { useRate } from '../../../state/rates';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { useTranslation } from '../../../hooks/translation';

export const MultiSendReceiversNotification: FC<{
    onClose: () => void;
    isOpen: boolean;
    form: MultiSendFormTokenized;
    asset: TonAsset;
}> = ({ onClose, isOpen, form, asset }) => {
    const { t } = useTranslation();
    const WrapperStyles = createGlobalStyle`
      .multi-send-receivers-notification {
        max-width: 1000px;
      }
    `;

    return (
        <>
            <WrapperStyles />
            <Notification
                title={t('wallets')}
                isOpen={isOpen}
                handleClose={onClose}
                wrapperClassName="multi-send-receivers-notification"
            >
                {() => <ReceiversTable form={form} asset={asset} />}
            </Notification>
        </>
    );
};

const ReceiversTableContainer = styled.div`
    display: grid;
    grid-template-columns: max-content minmax(88px, 1fr) max-content max-content;
    column-gap: 8px;
    align-items: center;
    grid-auto-rows: 36px 1px;
    padding: 0 12px;
    background-color: ${p => p.theme.backgroundContent};
    border-radius: ${p => p.theme.corner2xSmall};
`;

const RecipientCell = styled(Body2)`
    color: ${p => p.theme.textSecondary};
    font-family: ${p => p.theme.fontMono};
`;

const CommentCell = styled(Body2)`
    overflow: hidden;
    text-overflow: ellipsis;
`;

const FiatCell = styled(Body2)`
    color: ${p => p.theme.textSecondary};
    padding-right: 1rem;
`;

const AmountCell = styled(Body2)`
    text-align: right;
`;

const Divider = styled.div`
    background-color: ${p => p.theme.separatorCommon};
    height: 1px;
    grid-column: 1/-1;
    margin: 0 -1rem;
`;

const ReceiversTable: FC<{ form: MultiSendFormTokenized; asset: TonAsset }> = ({ form, asset }) => {
    const toStringReceiver = (item: MultiSendFormTokenized['rows'][number]['receiver']) => {
        if (item && 'dns' in item) {
            return item.dns.account.name;
        }

        return formatAddress(item!.address);
    };

    const { fiat } = useAppContext();
    const { data: rate } = useRate(asset.address === 'TON' ? 'TON' : asset.address.toRawString());

    const fiatToString = (weiAmount: MultiSendFormTokenized['rows'][number]['weiAmount']) => {
        return formatFiatCurrency(
            fiat,
            shiftedDecimals(weiAmount, asset.decimals).multipliedBy(rate?.prices || 0)
        );
    };

    const amountToString = (weiAmount: MultiSendFormTokenized['rows'][number]['weiAmount']) => {
        return (
            formatter.format(shiftedDecimals(weiAmount, asset.decimals), {
                decimals: asset.decimals
            }) +
            ' ' +
            asset.symbol
        );
    };

    return (
        <ReceiversTableContainer>
            {form.rows.map((item, index) => (
                <>
                    <RecipientCell>{toStringReceiver(item.receiver)}</RecipientCell>
                    <CommentCell>{item.comment}</CommentCell>
                    <FiatCell>≈&nbsp;{fiatToString(item.weiAmount)}</FiatCell>
                    <AmountCell>{amountToString(item.weiAmount)}</AmountCell>
                    {index !== form.rows.length - 1 && <Divider />}
                </>
            ))}
        </ReceiversTableContainer>
    );
};
