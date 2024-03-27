export interface StonfiAsset {
    contract_address: string;
    blacklisted: boolean;
}

class StonfiApi {
    public async fetchAssets(): Promise<StonfiAsset[]> {
        try {
            const response = await (
                await fetch('https://app.ston.fi/rpc', {
                    method: 'POST',
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: Date.now(),
                        method: 'asset.list'
                    }),
                    headers: { 'content-type': 'application/json' }
                })
            ).json();

            return response.result.assets;
        } catch (e) {
            console.log(e);
            return [];
        }
    }
}

export const stonfiApi = new StonfiApi();
