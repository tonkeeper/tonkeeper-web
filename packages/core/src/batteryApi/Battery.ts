/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';
import { ConnectBatteryService } from './services/ConnectBatteryService';
import { DefaultBatteryService } from './services/DefaultBatteryService';
import { EmulationBatteryService } from './services/EmulationBatteryService';
import { WalletBatteryService } from './services/WalletBatteryService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class Battery {
    public readonly connect: ConnectBatteryService;
    public readonly default: DefaultBatteryService;
    public readonly emulation: EmulationBatteryService;
    public readonly wallet: WalletBatteryService;
    public readonly request: BaseHttpRequest;
    constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? 'https://battery.tonkeeper.com',
            VERSION: config?.VERSION ?? '0.0.1',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });
        this.connect = new ConnectBatteryService(this.request);
        this.default = new DefaultBatteryService(this.request);
        this.emulation = new EmulationBatteryService(this.request);
        this.wallet = new WalletBatteryService(this.request);
    }
}

