import { InfiniteData } from '@tanstack/react-query';
import { TronEvent, TronEvents } from '@tonkeeper/core/dist/tronApi';
import { GenericActivityGroup, groupActivityGeneric } from '../activity';

export const getTronActivityGroup = (
    data: InfiniteData<TronEvents>
): GenericActivityGroup<TronEvent>[] => {
    const list = [] as TronEvent[];

    data.pages.forEach(page => {
        list.push(...page.events);
    });

    const activityGroups = groupActivityGeneric(
        list,
        item => item.timestamp,
        item => item.txHash
    );
    return activityGroups;
};
