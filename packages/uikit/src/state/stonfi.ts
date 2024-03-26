import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '../libs/queryKey';
import { stonfiApi, StonfiAsset } from '@tonkeeper/core/dist/service/stonfiService';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { useAppContext } from '../hooks/appContext';
import { Address } from '@ton/core';

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

export const useStonfiSwapLink = <T extends string | undefined>(
    token: T
): T extends string ? string : undefined => {
    const { tonendpoint, env } = useAppContext();

    if (token === undefined) {
        return undefined as T extends string ? string : undefined;
    }

    const isTon = token.toLowerCase() === CryptoCurrency.TON.toLowerCase();

    const tt = isTon ? 'jUSDT' : 'ton';
    const url = new URL('https://app.ston.fi/swap');
    url.searchParams.append('ft', isTon ? 'ton' : Address.parse(token).toString({ urlSafe: true }));
    url.searchParams.append('tt', tt);
    url.searchParams.append('referral_address', env?.stonfiReferralAddress || '');
    url.searchParams.append('utm_source', `tokeeper-${tonendpoint.targetEnv}`);
    url.searchParams.append('utm_medium', 'organic');
    url.searchParams.append('utm_campaign', 'swap_button');
    url.searchParams.append('utm_content', 'TODO');

    return url.toString() as T extends string ? string : undefined;
};
