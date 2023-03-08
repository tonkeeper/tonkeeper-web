import { beginCell, Cell, external } from 'ton-core';

import { WalletContractV3R1 } from 'ton/dist/wallets/WalletContractV3R1';
import { WalletContractV3R2 } from 'ton/dist/wallets/WalletContractV3R2';
import { WalletContractV4 } from 'ton/dist/wallets/WalletContractV4';
import { WalletState, WalletVersion } from '../../entries/wallet';

const workchain = 0;

export const walletContract = (wallet: WalletState) => {
  const publicKey = Buffer.from(wallet.publicKey, 'hex');
  switch (wallet.active.version) {
    case WalletVersion.v3R1:
      return WalletContractV3R1.create({ workchain, publicKey });
    case WalletVersion.v3R2:
      return WalletContractV3R2.create({ workchain, publicKey });
    case WalletVersion.v4R1:
      throw new Error('Unsupported wallet contract version - v4R1');
    case WalletVersion.v4R2:
      return WalletContractV4.create({ workchain, publicKey });
  }
};

export const externalMessage = (
  contract: WalletContractV3R1 | WalletContractV3R2 | WalletContractV4,
  seqno: number,
  body: Cell
) => {
  return beginCell()
    .storeWritable(
      external({
        to: contract.address,
        init: seqno === 0 ? contract.init : undefined,
        body: body,
      })
    )
    .endCell();
};
