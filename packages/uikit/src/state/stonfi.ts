import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '../libs/queryKey';
import { stonfiApi, StonfiAsset } from '@tonkeeper/core/dist/service/stonfiService';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { useAppContext } from '../hooks/appContext';
import { isTon, TonAssetAddress } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';

export const useStonfiAssets = () => {
    return useQuery<StonfiAsset[]>([QueryKey.stonfiAssets], () => stonfiApi.fetchAssets());
};

export const useIsStonfiAsset = (address: string) => {
    const { data: assets } = useStonfiAssets();

    return useQuery(
        [QueryKey.stonfiAssets, address],
        () => {
            if (address.toLowerCase() === CryptoCurrency.TON.toLowerCase()) {
                return true;
            }
            if (!assets) {
                return false;
            }
            return assets
                .filter(a => !a.blacklisted)
                .some(a => eqAddresses(a.contract_address, address));
        },
        { enabled: !!assets }
    );
};

export const useStonfiSwapLink = (fromToken: TonAssetAddress, toToken: TonAssetAddress): string => {
    const { tonendpoint, env } = useAppContext();

    const url = new URL('https://app.ston.fi/swap');
    url.searchParams.append('ft', addressToStonfiAddress(fromToken));
    url.searchParams.append('tt', addressToStonfiAddress(toToken));
    url.searchParams.append('referral_address', env?.stonfiReferralAddress || '');
    url.searchParams.append('utm_source', `tokeeper-${tonendpoint.targetEnv}`);
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
