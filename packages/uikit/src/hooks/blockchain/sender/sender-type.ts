import { TronSenderOption, TronSenderType } from './useTronSender';
import { TonSenderChoiceUserAvailable, TonSenderTypeUserAvailable } from '../useSender';

export type AllChainsSenderType = TronSenderType | TonSenderTypeUserAvailable;
export type AllChainsSenderOptions = TronSenderOption | TonSenderChoiceUserAvailable;
