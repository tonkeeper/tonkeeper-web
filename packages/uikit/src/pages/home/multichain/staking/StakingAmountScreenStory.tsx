import { FC, useState } from 'react';
import BigNumber from 'bignumber.js';

import { StakingAmountScreen } from './StakingAmountScreen';

const BALANCE = new BigNumber('10000.32');
const MAX = BALANCE.minus('1.1');

export const StakingAmountScreenStory: FC<{
    variant?: 'empty' | 'insufficient' | 'long';
    withReserveHints?: boolean;
}> = ({ variant = 'empty', withReserveHints }) => {
    const [result, setResult] = useState('');

    return (
        <div data-testid="staking-amount-story" data-result={result}>
            <StakingAmountScreen
                isOpen
                onClose={() => {}}
                title="Stake"
                available={BALANCE}
                maxAmount={MAX}
                initialAmount={
                    variant === 'insufficient'
                        ? '14788'
                        : variant === 'long'
                        ? '8989898989898989898989898989898989898989'
                        : undefined
                }
                getAmountError={amount => (amount.gt(MAX) ? 'Insufficient balance' : undefined)}
                getAmountErrorHint={
                    withReserveHints
                        ? () =>
                              'You need to leave a 1.1 GRAM reserve, which will be returned after staking.'
                        : undefined
                }
                maxHint={
                    withReserveHints
                        ? 'Max is your balance minus a 1.1 GRAM reserve, which will be returned after staking.'
                        : undefined
                }
                onContinue={(amount, isMax) => setResult(`${amount.toFixed()}:${isMax}`)}
            />
        </div>
    );
};
