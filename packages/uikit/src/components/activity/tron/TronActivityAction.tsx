import {
    ContractDeployAction,
    ReceiveTRC20Action,
    SendTRC20Action,
    TronAction
} from '@tonkeeper/core/dist/tronApi';
import { toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import { useFormatCoinValue } from '../../../hooks/balance';
import { useTranslation } from '../../../hooks/translation';
import {
    ReceiveActivityAction,
    SendActivityAction,
    WalletDeployActivityAction
} from '../ActivityActionLayout';
import { ErrorAction } from '../CommonAction';

const ReceiveTRC20: FC<{
    receiveTRC20: ReceiveTRC20Action;
    date: string;
}> = ({ receiveTRC20, date }) => {
    const format = useFormatCoinValue();

    return (
        <ReceiveActivityAction
            amount={format(receiveTRC20.amount, receiveTRC20.token.decimals)}
            symbol={receiveTRC20.token.symbol}
            sender={toShortValue(receiveTRC20.sender)}
            date={date}
        />
    );
};

const SendTRC20: FC<{
    sendTRC20: SendTRC20Action;
    date: string;
}> = ({ sendTRC20, date }) => {
    const format = useFormatCoinValue();

    return (
        <SendActivityAction
            amount={format(sendTRC20.amount, sendTRC20.token.decimals)}
            symbol={sendTRC20.token.symbol}
            recipient={toShortValue(sendTRC20.recipient)}
            date={date}
        />
    );
};

const ContractDeploy: FC<{
    contractDeploy: ContractDeployAction;
    date: string;
}> = ({ contractDeploy, date }) => {
    return (
        <WalletDeployActivityAction
            address={toShortValue(contractDeploy.ownerAddress!)}
            date={date}
        />
    );
};

export const TronActivityAction: FC<{
    action: TronAction;
    date: string;
}> = ({ action, date }) => {
    const { t } = useTranslation();

    if (action.receiveTRC20) {
        return <ReceiveTRC20 receiveTRC20={action.receiveTRC20} date={date} />;
    }
    if (action.sendTRC20) {
        return <SendTRC20 sendTRC20={action.sendTRC20} date={date} />;
    }
    if (action.contractDeploy) {
        return <ContractDeploy contractDeploy={action.contractDeploy} date={date} />;
    }

    console.log(action);
    return <ErrorAction>{t('txActions_signRaw_types_unknownTransaction')}</ErrorAction>;
};
