import { useState } from 'react';

import { TradeNetworkDropdown } from './TradeNetworkDropdown';

const NETWORKS = ['All', 'Bitcoin', 'Ethereum', 'Solana', 'Base', 'Arbitrum', 'Polygon'];

export const TradeNetworkDropdownInteractiveStory = () => {
    const [value, setValue] = useState('All');

    return (
        <div className="flex h-[420px] w-[390px] justify-end bg-backgroundPage p-2">
            <div>
                <TradeNetworkDropdown value={value} options={NETWORKS} onChange={setValue} />
            </div>
        </div>
    );
};
