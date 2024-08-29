import { InfiniteData } from '@tanstack/react-query';
import { AccountEvent, AccountEvents, Action, ActionTypeEnum } from '@tonkeeper/core/dist/tonApiV2';

const TonActivities: ActionTypeEnum[] = [
    'TonTransfer',
    'DepositStake',
    'WithdrawStake',
    'WithdrawStakeRequest',
    'SmartContractExec',
    'DomainRenew'
];

export const seeIfTonTransfer = (action: Action) => {
    if (TonActivities.includes(action.type)) {
        return true;
    } else if (action.type === 'ContractDeploy') {
        if (action.contractDeploy?.interfaces?.includes('wallet')) {
            return true;
        }
    }
    return false;
};

export const groupAndFilterTonActivityItems = (
    data: InfiniteData<AccountEvents>
): InfiniteData<AccountEvents> => {
    return {
        pages: data.pages.reduce((acc, item) => {
            const events = item.events.reduce((e, event) => {
                if (event.actions.every(seeIfTonTransfer)) {
                    e.push(event);
                }
                return e;
            }, [] as AccountEvent[]);
            if (events.length) {
                acc.push({ events, nextFrom: 0 });
            }
            return acc;
        }, [] as AccountEvents[]),
        pageParams: []
    };
};
