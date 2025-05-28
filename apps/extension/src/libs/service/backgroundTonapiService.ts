import { TonendpointConfig } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import memoryStore from '../store/memoryStore';
import ExtensionPlatform from './extension';

const getToken = async (url: string) => {
    let token = memoryStore.getTonapiToken();
    if (!token) {
        const version = new ExtensionPlatform().getVersion();
        const chainName = url.includes('testnet') ? 'testnet' : 'mainnet';

        const boot = `https://boot.tonkeeper.com/keys?build=${version}&chainName=${chainName}`;
        const result = await fetch(`https://c.tonapi.io/json?url=${btoa(boot)}`);
        const config: TonendpointConfig = await result.json();

        token = config.tonApiV2Key;

        if (!token) {
            throw new Error('Missing token');
        }
        memoryStore.setTonapiToken(token);
    }
    return token;
};

export const createTonapiRequest = async (url: string, options: RequestInit = {}) => {
    if (!isTonapiUrl(url)) {
        throw new Error('Unsupported endpoint');
    }

    const token = await getToken(url);
    const reqHeaders = new Headers(options.headers);
    const userToken = reqHeaders.get('Authorization');
    if (userToken) {
        reqHeaders.append('X-Authorization', userToken);
        reqHeaders.delete('Authorization');
    }
    reqHeaders.append('Authorization', `Bearer ${token}`);
    options.headers = reqHeaders;

    const response = await fetch(url, options);
    return {
        payload: await response.json(),
        status: response.status,
        statusText: response.statusText,
        headers: Array.from(response.headers)
    };
};


function isTonapiUrl(url: string) {
    try {
        const parsed = new URL(url);
        const allowedHosts = ['tonapi.io', 'testnet.tonapi.io'];
        return parsed.protocol === 'https:' && allowedHosts.includes(parsed.hostname);
    } catch (e) {
        return false;
    }
}
