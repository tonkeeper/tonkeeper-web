export {};
/*
import { FC } from 'react';
import { Action } from '@tonkeeper/core/dist/tonApiV2';
import { formatAddress, seeIfAddressEqual, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';

export const SmartContractExecAction: FC<{
    action: Action;
    date: string;
}> = ({ action, date }) => {
    const { t } = useTranslation();
    const { smartContractExec } = action;
    const wallet = useWalletContext();
    const format = useFormatCoinValue();

    if (!smartContractExec) {
        return <ErrorAction />;
    }

    if (seeIfAddressEqual(smartContractExec.contract.address, wallet.active.rawAddress)) {
        return (
            <ListItemGrid>
                <ActivityIcon status={action.status}>
                    <ContractDeployIcon />
                </ActivityIcon>
                <ColumnLayout
                    title={t('transactions_smartcontract_exec')}
                    amount={<>+&thinsp;{format(smartContractExec.tonAttached)}</>}
                    green
                    entry={CryptoCurrency.TON}
                    address={toShortValue(
                        formatAddress(smartContractExec.contract.address, wallet.network)
                    )}
                    date={date}
                />
                <FailedNote status={action.status} />
            </ListItemGrid>
        );
    } else {
        return (
            <ListItemGrid>
                <ActivityIcon status={action.status}>
                    <ContractDeployIcon />
                </ActivityIcon>
                <ColumnLayout
                    title={t('transactions_smartcontract_exec')}
                    amount={<>-&thinsp;{format(smartContractExec.tonAttached)}</>}
                    entry={CryptoCurrency.TON}
                    address={toShortValue(
                        formatAddress(smartContractExec.contract.address, wallet.network, true)
                    )}
                    date={date}
                />
                <FailedNote status={action.status} />
            </ListItemGrid>
        );
    }
};
*/
