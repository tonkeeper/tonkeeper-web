export enum AppRoute {
  import = '/import',
  settings = '/settings',
  activity = '/activity',
  coins = '/coins',
  home = '/',
}

export enum ImportRoute {
  import = '/import',
  create = '/create',
}

export enum SettingsRoute {
  index = '/',
  localization = '/localization',
  legal = '/legal',
  theme = '/theme',
  dev = '/dev',
  fiat = '/fiat',
  account = '/account',
  recovery = '/recovery',
  version = '/version',
  jettons = '/jettons',
  security = '/security',
  subscriptions = '/subscriptions',
}

export const any = (route: string): string => {
  return `${route}/*`;
};

export const relative = (path: string): string => {
  return `.${path}`;
};
