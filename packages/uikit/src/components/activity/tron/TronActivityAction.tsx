import { TronAction } from '@tonkeeper/core/dist/tronApi';
import { toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import { useFormatCoinValue } from '../../../hooks/balance';
import { useTranslation } from '../../../hooks/translation';
import { Label1 } from '../../Text';
import { ActivityIcon, ContractDeployIcon, ReceiveIcon, SentIcon } from '../ActivityIcons';
import {
    AmountText,
    ColumnLayout,
    Description,
    ErrorAction,
    FirstLabel,
    FirstLine,
    ListItemGrid,
    SecondLine,
    SecondaryText
} from '../CommonAction';

const ReceiveTRC20: FC<{
    action: TronAction;
    date: string;
}> = ({ action, date }) => {
    const { t } = useTranslation();

    const format = useFormatCoinValue();

    const { receiveTRC20 } = action;
    if (!receiveTRC20) return <ErrorAction />;

    return (
        <ListItemGrid>
            <ActivityIcon>
                <ReceiveIcon />
            </ActivityIcon>
            <Description>
                <FirstLine>
                    <FirstLabel>{t('transaction_type_receive')}</FirstLabel>
                    <AmountText>
                        +&thinsp;
                        {format(receiveTRC20.amount, receiveTRC20.token.decimals)}
                    </AmountText>
                    <Label1>{receiveTRC20.token.symbol}</Label1>
                </FirstLine>
                <SecondLine>
                    <SecondaryText>{toShortValue(receiveTRC20.sender)}</SecondaryText>
                    <SecondaryText>{date}</SecondaryText>
                </SecondLine>
            </Description>
        </ListItemGrid>
    );
};

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

const ContractDeploy: FC<{
    action: TronAction;
    date: string;
}> = ({ action, date }) => {
    const { t } = useTranslation();

    const { contractDeploy } = action;
    if (!contractDeploy) return <ErrorAction />;

    return (
        <ListItemGrid>
            <ActivityIcon>
                <ContractDeployIcon />
            </ActivityIcon>
            <ColumnLayout
                title={t('transaction_type_contract_deploy')}
                entry="-"
                address={toShortValue(contractDeploy.ownerAddress!)}
                date={date}
            />
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
            return <ReceiveTRC20 action={action} date={date} />;
        case 'SendTRC20':
            return <SendTRC20 action={action} date={date} />;
        case 'ContractDeploy':
            return <ContractDeploy action={action} date={date} />;
        default: {
            console.log(action);
            return <ErrorAction>{t('txActions_signRaw_types_unknownTransaction')}</ErrorAction>;
        }
    }
};
