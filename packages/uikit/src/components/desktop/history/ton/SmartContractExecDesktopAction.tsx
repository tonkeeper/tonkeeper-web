import React, { FC } from 'react';
import { Action } from '@tonkeeper/core/dist/tonApiV2';
import {
    ActionRow,
    ErrorRow,
    HistoryCellAccount,
    HistoryCellActionGeneric,
    HistoryCellAmount,
    HistoryCellComment
} from './HistoryCell';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { CodeIcon } from '../../../Icon';
import { useTranslation } from '../../../../hooks/translation';
import { useActiveWallet } from '../../../../state/wallet';

export const SmartContractExecDesktopAction: FC<{
    action: Action;
    isScam: boolean;
}> = ({ action, isScam }) => {
    const wallet = useActiveWallet();
    const { smartContractExec } = action;
    const { t } = useTranslation();

    if (!smartContractExec) {
        return <ErrorRow />;
    }

    return (
        <>
            <HistoryCellActionGeneric
                icon={<CodeIcon color="iconPrimary" />}
                isFailed={action.status === 'failed'}
            >
                {t('transactions_smartcontract_exec')}
            </HistoryCellActionGeneric>
            <HistoryCellAccount account={smartContractExec.contract} />
            <ActionRow>
                <HistoryCellComment />
                <HistoryCellAmount
                    amount={smartContractExec.tonAttached}
                    symbol={CryptoCurrency.TON}
                    decimals={9}
                    isFailed={action.status === 'failed'}
                    isSpam={isScam}
                    isNegative={!eqAddresses(smartContractExec.contract.address, wallet.rawAddress)}
                />
            </ActionRow>
        </>
    );
};
