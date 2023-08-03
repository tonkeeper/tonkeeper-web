import { TronAction } from '@tonkeeper/core/dist/tronApi';
import { toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import { useFormatCoinValue } from '../../../hooks/balance';
import { useTranslation } from '../../../hooks/translation';
import { Label1 } from '../../Text';
import { ActivityIcon, SentIcon } from '../ActivityIcons';
import {
    AmountText,
    Description,
    ErrorAction,
    FirstLabel,
    FirstLine,
    ListItemGrid,
    SecondLine,
    SecondaryText
} from '../CommonAction';

const SendTRC20: FC<{
    action: TronAction;
    date: string;
}> = ({ action, date }) => {
    const { t } = useTranslation();

    const format = useFormatCoinValue();

    const { sendTRC20 } = action;
    if (!sendTRC20) return <ErrorAction />;

    return (
        <ListItemGrid>
            <ActivityIcon>
                <SentIcon />
            </ActivityIcon>
            <Description>
                <FirstLine>
                    <FirstLabel>{t('transaction_type_sent')}</FirstLabel>
                    <AmountText>
                        -&thinsp;
                        {format(sendTRC20.amount, sendTRC20.token.decimals)}
                    </AmountText>
                    <Label1>{sendTRC20.token.symbol}</Label1>
                </FirstLine>
                <SecondLine>
                    <SecondaryText>{toShortValue(sendTRC20.recipient)}</SecondaryText>
                    <SecondaryText>{date}</SecondaryText>
                </SecondLine>
            </Description>
        </ListItemGrid>
    );
};

export const TronActivityAction: FC<{
    action: TronAction;
    date: string;
}> = ({ action, date }) => {
    const { t } = useTranslation();

    switch (action.type) {
        case 'ReceiveTRC20':
        // return <TonTransferAction action={action} date={date} isScam={isScam} />;
        case 'SendTRC20':
            return <SendTRC20 action={action} date={date} />;
        case 'ContractDeploy':
        // return <NftItemTransferAction action={action} date={date} />;
        default: {
            console.log(action);
            return <ErrorAction>{t('txActions_signRaw_types_unknownTransaction')}</ErrorAction>;
        }
    }
};
