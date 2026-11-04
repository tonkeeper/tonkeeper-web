import { TradingMarketAsset } from '@tonkeeper/core/dist/service/tradingService';

import { screenshot } from '../../../../../playwright/test';
import { TradeTokenGridCell } from './TradeTokenGridCell';

// Edge cases the screenshot suite targets:
//   - native coin renders without a chain badge; a token on a known chain
//     shows the 20px badge overhanging the 56px thumb.
//   - positive vs negative 24h change drives the accent colour and the
//     explicit sign formatting.
//   - long symbol truncates inside the fixed cell width.
//   - missing image falls back to the network glyph.

const sampleAsset = (overrides: Partial<TradingMarketAsset>): TradingMarketAsset => ({
    assetId: 'ton/mainnet/coin',
    assetType: 'asset',
    symbol: 'TON',
    name: 'Toncoin',
    decimals: 9,
    image: '',
    isScam: false,
    verification: 'whitelist' as const,
    trustScore: 95,
    ...overrides
});

const ROW = 'flex w-[358px] items-start justify-between rounded-medium bg-backgroundContent px-3';

screenshot('TradeTokenGridCell row of four', () => (
    <div className={ROW}>
        <TradeTokenGridCell asset={sampleAsset({ change24hPercent: '4.12' })} />
        <TradeTokenGridCell
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0xshib',
                symbol: 'SHIB',
                change24hPercent: '-1.01'
            })}
        />
        <TradeTokenGridCell
            asset={sampleAsset({
                assetId: 'bsc/mainnet/bep20/0xcake',
                symbol: 'SUPERLONGTOKEN',
                change24hPercent: '2.32'
            })}
        />
        <TradeTokenGridCell asset={sampleAsset({ assetId: 'btc/mainnet/coin', symbol: 'BTC' })} />
    </div>
));
