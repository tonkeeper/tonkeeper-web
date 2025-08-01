import { TronSenderChoice, TronSenderType } from './useTronSender';
import { TonSenderChoiceUserAvailable, TonSenderTypeUserAvailable } from '../useSender';

export type AllChainsSenderType = TronSenderType | TonSenderTypeUserAvailable;
export type AllChainsSenderChoice = TronSenderChoice | TonSenderChoiceUserAvailable;
