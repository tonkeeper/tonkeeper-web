export interface DAppMessage {
  id: number;
  method: string;
  params: any;
  origin: string;
}

export type TonkeeperApiMessage = TonkeeperApiResponse | TonkeeperApiEvent;

export interface TonkeeperError {
  message: string;
  code: number;
  description?: string;
}

export interface TonkeeperApiResponse {
  type: 'TonkeeperAPI';
  message: {
    jsonrpc: '2.0';
    id: number;
    method: string;
    result: undefined | unknown;
    error?: TonkeeperError;
  };
}

export interface TonkeeperApiEvent {
  type: 'TonkeeperAPI';
  message: {
    jsonrpc: '2.0';
    id?: undefined;
    method: 'accountsChanged' | 'chainChanged';
    result: undefined | unknown;
    error?: TonkeeperError;
  };
}
