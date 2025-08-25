import { TRON_SENDER_TYPE, TronSenderOption, TronSenderType } from './useTronSender';
import { TonSenderChoiceUserAvailable, TonSenderTypeUserAvailable } from '../useSender';
import { assertUnreachableSoft } from '@tonkeeper/core/dist/utils/types';

export type AllChainsSenderType = TronSenderType | TonSenderTypeUserAvailable;
export type AllChainsSenderOptions = TronSenderOption | TonSenderChoiceUserAvailable;

export const isTronSenderOption = (option: AllChainsSenderOptions): option is TronSenderOption => {
    switch (option.type) {
        case 'battery':
        case 'external':
        case 'gasless':
            return false;
        case TRON_SENDER_TYPE.BATTERY:
        case TRON_SENDER_TYPE.TRX:
        case TRON_SENDER_TYPE.TON_ASSET:
            return true;
        default:
            assertUnreachableSoft(option);
            return false;
    }
};
