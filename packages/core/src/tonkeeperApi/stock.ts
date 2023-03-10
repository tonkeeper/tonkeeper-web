const yesterdayKeys = ['USD', 'EUR', 'ETH', 'RUB', 'TON'];
const todayKeys = [
  'AED',
  'AFN',
  'ALL',
  'AMD',
  'ANG',
  'AOA',
  'ARS',
  'AWG',
  'AZN',
  'BAM',
  'BBD',
  'BDT',
  'BGN',
  'BHD',
  'BIF',
  'BMD',
  'BND',
  'BOB',
  'BRL',
  'BSD',
  'BTN',
  'BWP',
  'BYN',
  'BYR',
  'BZD',
  'CAD',
  'CDF',
  'CHF',
  'CLF',
  'CLP',
  'CNY',
  'COP',
  'CRC',
  'CUC',
  'CVE',
  'CZK',
  'DJF',
  'DKK',
  'DOP',
  'DZD',
  'EGP',
  'ETB',
  'EUR',
  'FJD',
  'FKP',
  'GBP',
  'GEL',
  'GHS',
  'GIP',
  'GMD',
  'GNF',
  'GTQ',
  'GYD',
  'HKD',
  'HNL',
  'HRK',
  'HTG',
  'HUF',
  'IDR',
  'ILS',
  'INR',
  'IQD',
  'ISK',
  'JMD',
  'JOD',
  'JPY',
  'KES',
  'KGS',
  'KHR',
  'KMF',
  'KRW',
  'KWD',
  'KYD',
  'KZT',
  'LAK',
  'LBP',
  'LKR',
  'LRD',
  'LSL',
  'LYD',
  'MAD',
  'MDL',
  'MGA',
  'MKD',
  'MMK',
  'MNT',
  'MOP',
  'MRO',
  'MUR',
  'MVR',
  'MWK',
  'MXN',
  'MYR',
  'MZN',
  'NAD',
  'NGN',
  'NIO',
  'NOK',
  'NPR',
  'NZD',
  'OMR',
  'PAB',
  'PEN',
  'PGK',
  'PHP',
  'PKR',
  'PLN',
  'PYG',
  'QAR',
  'RON',
  'RSD',
  'RUB',
  'RWF',
  'SAR',
  'SBD',
  'SCR',
  'SEK',
  'SHP',
  'SKK',
  'SLL',
  'SRD',
  'STD',
  'SVC',
  'SZL',
  'THB',
  'TJS',
  'TMT',
  'TND',
  'TOP',
  'TRY',
  'TTD',
  'TWD',
  'TZS',
  'UAH',
  'UGX',
  'UYU',
  'UZS',
  'VES',
  'VND',
  'VUV',
  'WST',
  'XAF',
  'XAG',
  'XAU',
  'XCD',
  'XOF',
  'XPD',
  'XPF',
  'XPT',
  'YER',
  'ZAR',
  'ZMK',
  'ZMW',
  'JEP',
  'GGP',
  'IMP',
  'GBX',
  'CNH',
  'EEK',
  'LTL',
  'LVL',
  'TMM',
  'ZWD',
  'VEF',
  'SGD',
  'AUD',
  'USD',
  'BTC',
  'BCH',
  'BSV',
  'ETH',
  'ETH2',
  'ETC',
  'LTC',
  'ZRX',
  'USDC',
  'BAT',
  'LOOM',
  'MANA',
  'KNC',
  'LINK',
  'DNT',
  'MKR',
  'CVC',
  'OMG',
  'GNT',
  'DAI',
  'SNT',
  'ZEC',
  'XRP',
  'REP',
  'XLM',
  'EOS',
  'XTZ',
  'ALGO',
  'DASH',
  'ATOM',
  'OXT',
  'COMP',
  'ENJ',
  'REPV2',
  'BAND',
  'NMR',
  'CGLD',
  'UMA',
  'LRC',
  'YFI',
  'UNI',
  'BAL',
  'REN',
  'WBTC',
  'NU',
  'YFII',
  'FIL',
  'AAVE',
  'BNT',
  'GRT',
  'SNX',
  'STORJ',
  'SUSHI',
  'MATIC',
  'SKL',
  'ADA',
  'ANKR',
  'CRV',
  'ICP',
  'NKN',
  'OGN',
  '1INCH',
  'USDT',
  'FORTH',
  'CTSI',
  'TRB',
  'POLY',
  'MIR',
  'RLC',
  'DOT',
  'SOL',
  'DOGE',
  'MLN',
  'GTC',
  'AMP',
  'SHIB',
  'CHZ',
  'KEEP',
  'LPT',
  'QNT',
  'BOND',
  'RLY',
  'CLV',
  'FARM',
  'MASK',
  'ANT',
  'FET',
  'PAX',
  'ACH',
  'ASM',
  'PLA',
  'RAI',
  'TRIBE',
  'ORN',
  'IOTX',
  'UST',
  'QUICK',
  'AXS',
  'REQ',
  'WLUNA',
  'TRU',
  'RAD',
  'COTI',
  'DDX',
  'SUKU',
  'RGT',
  'XYO',
  'ZEN',
  'AST',
  'AUCTION',
  'BUSD',
  'JASMY',
  'WCFG',
  'BTRST',
  'AGLD',
  'AVAX',
  'FX',
  'TRAC',
  'LCX',
  'ARPA',
  'BADGER',
  'KRL',
  'PERP',
  'RARI',
  'DESO',
  'API3',
  'NCT',
  'SHPING',
  'UPI',
  'CRO',
  'MTL',
  'ABT',
  'CVX',
  'AVT',
  'MDT',
  'VGX',
  'ALCX',
  'COVAL',
  'FOX',
  'MUSD',
  'CELR',
  'GALA',
  'POWR',
  'GYEN',
  'ALICE',
  'INV',
  'LQTY',
  'PRO',
  'SPELL',
  'ENS',
  'DIA',
  'BLZ',
  'CTX',
  'ERN',
  'IDEX',
  'MCO2',
  'POLS',
  'SUPER',
  'UNFI',
  'STX',
  'KSM',
  'GODS',
  'IMX',
  'RBN',
  'BICO',
  'GFI',
  'ATA',
  'GLM',
  'MPL',
  'PLU',
  'SWFTC',
  'SAND',
  'OCEAN',
  'GNO',
  'FIDA',
  'ORCA',
  'CRPT',
  'QSP',
  'RNDR',
  'NEST',
  'PRQ',
  'HOPR',
  'JUP',
  'MATH',
  'SYN',
  'AIOZ',
  'WAMPL',
  'AERGO',
  'INDEX',
  'TONE',
  'HIGH',
  'GUSD',
  'FLOW',
  'ROSE',
  'OP',
  'APE',
  'MINA',
  'MUSE',
  'SYLO',
  'CBETH',
  'DREP',
  'ELA',
  'FORT',
  'ALEPH',
  'DEXT',
  'FIS',
  'BIT',
  'GMT',
  'GST',
  'MEDIA',
  'C98',
  '00',
  'APT',
  'AURORA',
  'BOBA',
  'DAR',
  'DYP',
  'EGLD',
  'GAL',
  'GHST',
  'HBAR',
  'HFT',
  'ILV',
  'INJ',
  'LDO',
  'LIT',
  'LOKA',
  'MAGIC',
  'METIS',
  'MNDE',
  'MONA',
  'MSOL',
  'MXC',
  'NEAR',
  'OOKI',
  'PNG',
  'POND',
  'PUNDIX',
  'PYR',
  'QI',
  'RARE',
  'RPL',
  'STG',
  'TIME',
  'WAXL',
  'XCN',
  'XMON',
  'TON',
];

export interface TonendpointStock {
  today: {
    [key: typeof todayKeys[number]]: string;
  };
  yesterday: {
    [key: typeof yesterdayKeys[number]]: string;
  };
}
