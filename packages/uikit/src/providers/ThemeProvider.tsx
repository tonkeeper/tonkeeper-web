import { userDefaultTheme } from '@tonkeeper/core/dist/entries/theme';
import React, { FC, PropsWithChildren, useMemo } from 'react';
import { DefaultTheme, ThemeProvider } from 'styled-components';
import { Loading } from '../components/Loading';
import { useUserTheme } from '../state/theme';
import { defaultTheme } from '../styles/defaultTheme';
import { GlobalStyle } from '../styles/globalStyle';

export const UserThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  const { data, isFetched } = useUserTheme();

  const currentTheme = useMemo(() => {
    if (!data || data.name === 'default') {
      return defaultTheme;
    } else {
      return Object.entries(defaultTheme)
        .map(
          ([key, value]: [string, string]) =>
            [
              key,
              value === userDefaultTheme.color ? data.color : value,
            ] as const
        )
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
    }
  }, [data]);

  if (!isFetched) {
    return <Loading />;
  }

  return (
    <ThemeProvider theme={currentTheme as DefaultTheme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  );
};
