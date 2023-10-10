import { Configuration as TonV2Configuration } from '../tonApiV2';
import { Configuration as TronConfiguration } from '../tronApi';

export interface APIConfig {
    tonApiV2: TonV2Configuration;
    tronApi: TronConfiguration;
}
