import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import { FC, useMemo } from 'react';
import styled from 'styled-components';
import { useCoinFullBalance } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { formatActivityDate } from '../../state/activity';
import { useFormatFiat, useRate } from '../../state/rates';
import { ListBlock } from '../List';
import { Body2, Label1 } from '../Text';
import { TonActivityEvents } from '../activity/ton/TonActivityEvents';
import { AccountEvent } from '@tonkeeper/core/dist/tonApiV2';

const Fee = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    color: ${props => props.theme.textSecondary};
    padding: 0 16px 12px;
    box-sizing: border-box;
`;

const ExtraDetails: FC<{
    extra: number;
}> = ({ extra }) => {
    const { t } = useTranslation();

    const feeAmount = extra < 0 ? extra * -1 : extra;
    const amount = useCoinFullBalance(feeAmount);

    const { data } = useRate(CryptoCurrency.TON);
    const { fiatAmount } = useFormatFiat(data, formatDecimals(feeAmount));

    let value = `≈ ${amount} ${CryptoCurrency.TON}`;

    if (fiatAmount) {
        value += ` · ${fiatAmount}`;
    }
    return (
        <Fee>
            <Body2>{extra > 0 ? t('txActions_refund') : t('transaction_fee')}</Body2>
            <Body2>{value}</Body2>
        </Fee>
    );
};

const Block = styled.div`
    width: 100%;
    box-sizing: border-box;
    padding: 12px 16px;

    background-color: ${props => props.theme.accentOrange};
    position: relative;
    border-radius: ${props => props.theme.cornerSmall};

    user-select: none;
`;

export const EmulationList: FC<{
    isError: boolean;
    event: AccountEvent | undefined;
    hideExtraDetails?: boolean;
}> = ({ isError, event, hideExtraDetails }) => {
    const { t, i18n } = useTranslation();

    const [date, timestamp] = useMemo(() => {
        const _timestamp = event?.timestamp ? event?.timestamp * 1000 : Date.now();
        return [formatActivityDate(i18n.language, 'now', _timestamp), _timestamp] as const;
    }, [event]);

    if (isError) {
        return (
            <Block>
                <Label1>{t('send_fee_estimation_error')}</Label1>
            </Block>
        );
    }

    if (event) {
        return (
            <>
                <ListBlock noUserSelect fullWidth margin={false}>
                    <TonActivityEvents
                        hover={false}
                        event={event}
                        date={date}
                        timestamp={timestamp}
                        setActivity={() => null}
                    />
                </ListBlock>
                {!hideExtraDetails && <ExtraDetails extra={event.extra} />}
            </>
        );
    }

    return <></>;
};
