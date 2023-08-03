import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { AmountData, RecipientData, TonRecipientData } from '@tonkeeper/core/dist/entries/send';

import React, { FC } from 'react';
import { TonAmountView } from './TonAmountView';

export const AmountView: FC<{
    onClose: () => void;
    onBack: (data: AmountData | undefined) => void;
    setAmount: (data: AmountData | undefined) => void;
    recipient: RecipientData;
    defaultTokenAmount?: { token?: string; amount?: string; max?: boolean };
}> = ({ recipient, ...rest }) => {
    if (recipient.address.blockchain === BLOCKCHAIN_NAME.TON) {
        return <TonAmountView recipient={recipient as TonRecipientData} {...rest} />;
    }

    return null; //<TronAmountView recipient={recipient as TronRecipientData} {...rest} />;
};
