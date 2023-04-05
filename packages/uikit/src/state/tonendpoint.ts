import { useQuery } from '@tanstack/react-query';
import {
  Language,
  localizationText,
} from '@tonkeeper/core/dist/entries/language';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { TonendpointStock } from '@tonkeeper/core/dist/tonkeeperApi/stock';
import {
  TonendpoinFiatMethods,
  Tonendpoint,
  TonendpointConfig,
  getFiatMethods,
  getServerConfig,
  getStock,
} from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { useMemo } from 'react';
import { useAppContext } from '../hooks/appContext';
import { QueryKey, TonkeeperApiKey } from '../libs/queryKey';

export const useTonendpoint = (
  build: string,
  network?: Network,
  lang?: Language
) => {
  return useMemo(() => {
    return new Tonendpoint(
      { build, network, lang: localizationText(lang) },
      {}
    );
  }, [build, network, lang]);
};

export const useTonenpointConfig = (tonendpoint: Tonendpoint) => {
  return useQuery<TonendpointConfig, Error>(
    [QueryKey.tonkeeperApi, TonkeeperApiKey.config],
    async () => {
      return getServerConfig(tonendpoint);
    }
  );
};

export const DefaultRefetchInterval = 60000; // 60 sec

export const useTonenpointStock = () => {
  const { tonendpoint } = useAppContext();
  return useQuery<TonendpointStock, Error>(
    [QueryKey.tonkeeperApi, TonkeeperApiKey.stock],
    () => getStock(tonendpoint),
    {
      refetchInterval: DefaultRefetchInterval,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
      keepPreviousData: true,
    }
  );
};

export const useTonenpointFiatMethods = (tonendpoint: Tonendpoint) => {
  return useQuery<TonendpoinFiatMethods, Error>(
    [QueryKey.tonkeeperApi, TonkeeperApiKey.stock, tonendpoint.params.lang],
    async () => {
      return getFiatMethods(tonendpoint);
    }
  );
};
