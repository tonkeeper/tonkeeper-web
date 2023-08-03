import { InfiniteData } from '@tanstack/react-query';
import { AccountEvent, AccountEvents200Response, Action } from '@tonkeeper/core/dist/tonApiV1';
import { GenericActivityGroup, groupActivityGeneric } from '../activity';

export type ActivityGroup = GenericActivityGroup<AccountEvent>;

export const groupActivityItems = (data: InfiniteData<AccountEvents200Response>) => {
    const list = [] as AccountEvent[];

    data.pages.forEach(page => {
        page.events.forEach(event => {
            list.push(event);
        });
    });

    return list;
};
export const groupAndFilterJettonActivityItems = (
    data: InfiniteData<AccountEvents200Response>,
    walletAddress: string
) => {
    const list = [] as AccountEvent[];

    data.pages.forEach(page => {
        page.events.forEach(event => {
            if (walletAddress) {
                event.actions = event.actions.filter(action => {
                    if (action.tonTransfer) {
                        return (
                            action.tonTransfer.sender.address === walletAddress ||
                            action.tonTransfer.recipient.address === walletAddress
                        );
                    } else if (action.contractDeploy) {
                        return action.contractDeploy.deployer.address === walletAddress;
                    }
                    return true;
                });
            }
            list.push(event);
        });
    });
    return list;
};

const seeIfTonTransfer = (action: Action) => {
    if (action.type === 'TonTransfer') {
        return true;
    } else if (action.type === 'ContractDeploy') {
        if (action.contractDeploy?.interfaces?.includes('wallet')) {
            return true;
        }
    }
    return false;
};

export const groupAndFilterTonActivityItems = (data: InfiniteData<AccountEvents200Response>) => {
    const list = [] as AccountEvent[];

    data.pages.forEach(page => {
        page.events.forEach(event => {
            const tonTransferEvent = event.actions.every(seeIfTonTransfer);
            if (tonTransferEvent) {
                list.push(event);
            }
        });
    });
    return list;
};

export const groupActivity = (list: AccountEvent[]): GenericActivityGroup<AccountEvent>[] => {
    return groupActivityGeneric(
        list,
        item => item.timestamp * 1000,
        item => item.eventId
    );
};
