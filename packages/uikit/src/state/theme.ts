import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Theme, userDefaultTheme } from '@tonkeeper/core/dist/entries/theme';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useStorage } from '../hooks/storage';

export const useUserTheme = () => {
  const storage = useStorage();
  return useQuery([AppKey.THEME], async () => {
    const theme = await storage.get<Theme>(AppKey.THEME);
    return theme ?? userDefaultTheme;
  });
};

export const useUserThemes = (account = 'account') => {
  return useQuery([AppKey.THEME, account], async () => {
    const items: Theme[] = [
      userDefaultTheme,
      {
        name: 'dev',
        color: 'green',
      },
    ];
    return items;
  });
};

export const useMutateTheme = () => {
  const storage = useStorage();
  const client = useQueryClient();
  return useMutation<void, Error, Theme>(async (theme) => {
    await storage.set(AppKey.THEME, theme);
    await client.invalidateQueries([AppKey.THEME]);
  });
};
