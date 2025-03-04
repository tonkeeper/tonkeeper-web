import { TonProvider } from '.';

interface TonApiResult {
    payload: Object;
    status: number;
    statusText: string;
    headers: [string, string][];
}

export class TonApi {
    constructor(private provider: TonProvider) {}

    fetch = async (url: string, options: unknown) => {
        const { payload, status, statusText, headers } = await this.provider.send<TonApiResult>(
            'tonapi_request',
            url,
            options
        );

        return new Response(JSON.stringify(payload), {
            status,
            statusText,
            headers: new Headers(headers)
        });
    };
}
