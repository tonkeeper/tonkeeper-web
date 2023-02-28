import { FiatCurrencies } from './fiat';
import { Language } from './language';
import { Network } from './network';
import { WalletProxy } from './proxy';
import { WalletFavorite } from './suggestion';

export enum WalletVersion {
  v3R1 = 0,
  v3R2 = 1,
  v4R1 = 2,
  v4R2 = 3,
}

export const WalletVersions = [
  WalletVersion.v3R1,
  WalletVersion.v3R2,
  WalletVersion.v4R2,
];

export const walletVersionText = (version: WalletVersion) => {
  switch (version) {
    case WalletVersion.v3R1:
      return 'v3R1';
    case WalletVersion.v3R2:
      return 'v3R2';
    case WalletVersion.v4R2:
      return 'v4R2';
    default:
      return String(version);
  }
};

export interface WalletAddress {
  friendlyAddress: string;
  rawAddress: string;
  version: WalletVersion;
}

export interface WalletVoucher {
  secretKey: string;
  publicKey: string;
  sharedKey: string;
  voucher: string;
}

export interface WalletState {
  publicKey: string;
  name?: string;

  revision: number;
  voucher?: WalletVoucher;

  network?: Network;

  active: WalletAddress;

  hiddenJettons?: string[];
  shownJettons?: string[];
  orderJettons?: string[];

  lang?: Language;
  fiat?: FiatCurrencies;
  theme?: string;

  proxy?: WalletProxy;

  favorites?: WalletFavorite[];
}
