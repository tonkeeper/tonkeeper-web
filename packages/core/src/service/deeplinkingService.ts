import queryString from 'query-string';
import { seeIfValidAddress } from '../utils/common';

export interface TonTransferParams {
  address: string;
  amount?: string;
  text?: string;
  jetton?: string;
}

export function parseTonTransfer(options: { url: string }) {
  try {
    const data = queryString.parseUrl(options.url);

    const paths = data.url.split('/');

    let linkAddress: string;
    if (paths.length === 0) {
      throw new Error('Empty link');
    } else if (paths.length === 1 && seeIfValidAddress(options.url)) {
      linkAddress = paths[0];
    } else {
      const [operator, address] = paths.slice(-2);
      if (operator === 'transfer' && seeIfValidAddress(address)) {
        linkAddress = address;
      } else {
        throw new Error('unknown operator ' + data.url);
      }
    }

    const result: TonTransferParams = {
      address: linkAddress,
      ...data.query,
    };

    return result;
  } catch (e) {
    console.log(e);
    return null;
  }
}
