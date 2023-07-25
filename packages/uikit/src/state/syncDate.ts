import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { seeIfServiceTimeSync } from '@tonkeeper/core/dist/service/transfer/common';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import {
  getCachedStoreValue,
  removeCachedStoreValue,
  setCachedStoreValue,
} from './cache';

export const useServiceTimeIsSync = () => {
  const { tonApi } = useAppContext();
  return useQuery<boolean, Error>([QueryKey.system], () =>
    seeIfServiceTimeSync(tonApi)
  );
};

export const cleanSyncDateBanner = async (
  client: QueryClient,
  sdk: IAppSdk
) => {
  await removeCachedStoreValue(sdk, AppKey.SYNC_DATE);
  await client.invalidateQueries([QueryKey.system]);
  await client.invalidateQueries([QueryKey.syncDate]);
};

export const useSyncDateBanner = () => {
  const sdk = useAppSdk();
  return useQuery([QueryKey.syncDate], async () => {
    const showBanner = await getCachedStoreValue<boolean>(sdk, AppKey.SYNC_DATE);
    return showBanner === null ? true : showBanner;
  });
};

const oneWeek = 7 * 24 * 60 * 60 * 1000;

export const useMutateSyncDateBanner = () => {
  const sdk = useAppSdk();
  const client = useQueryClient();
  return useMutation<void, Error, boolean>(async (value) => {
    await setCachedStoreValue(
      sdk,
      AppKey.SYNC_DATE,
      value,
      Date.now() + oneWeek
    );
    await client.invalidateQueries([QueryKey.syncDate]);
  });
};
