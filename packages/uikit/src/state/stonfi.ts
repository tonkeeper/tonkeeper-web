import { useAppContext } from '../hooks/appContext';
import { isTon, TonAssetAddress } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';

export const useStonfiSwapLink = (fromToken: TonAssetAddress, toToken: TonAssetAddress): string => {
    const { tonendpoint, env } = useAppContext();

    return generateStonfiSwapLink(
        fromToken,
        toToken,
        tonendpoint.targetEnv,
        env?.stonfiReferralAddress
    );
};

export const generateStonfiSwapLink = (
    fromToken: TonAssetAddress,
    toToken: TonAssetAddress,
    targetEnv: string,
    referralAddress?: string
) => {
    const url = new URL('https://app.ston.fi/swap');
    url.searchParams.append('ft', addressToStonfiAddress(fromToken));
    url.searchParams.append('tt', addressToStonfiAddress(toToken));
    url.searchParams.append('referral_address', referralAddress || '');
    url.searchParams.append('utm_source', `tokeeper-${targetEnv}`);
    url.searchParams.append('utm_medium', 'organic');
    url.searchParams.append('utm_campaign', 'swap_button');
    url.searchParams.append('utm_content', 'TODO');

    return url.toString();
};

const addressToStonfiAddress = (address: TonAssetAddress) => {
    if (isTon(address)) {
        return 'ton';
    }
    return address.toString({ urlSafe: true });
};
