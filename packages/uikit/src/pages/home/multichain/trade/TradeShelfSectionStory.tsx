import { useState } from 'react';

import { TradingShelfGroup } from '@tonkeeper/core/dist/service/tradingService';

import { TradeShelfSection } from './TradeShelfSection';

export const TradeShelfSectionRemountStory = ({ group }: { group: TradingShelfGroup }) => {
    const [shown, setShown] = useState(true);

    return (
        <div className="w-[390px] bg-backgroundPage px-4 py-2">
            <button
                aria-label={group.id}
                className="size-4"
                data-testid="toggle-section"
                onClick={() => setShown(value => !value)}
            />
            {shown && <TradeShelfSection group={group} />}
        </div>
    );
};
