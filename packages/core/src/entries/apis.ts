import { Configuration as TonV1Configuration } from '../tonApiV1';
import { Configuration as TonV2Configuration } from '../tonApiV2';
import { Configuration as TronConfiguration } from '../tronApi';

export interface APIConfig {
    tonApi: TonV1Configuration;
    tonApiV2: TonV2Configuration;
    tronApi: TronConfiguration;
}
