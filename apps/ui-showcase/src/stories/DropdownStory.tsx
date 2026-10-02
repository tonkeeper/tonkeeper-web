import { useState } from 'react';
import { Dropdown, SelectPill } from '@tonkeeper/ui-kit';
import IcGlobe16 from '@tonkeeper/ui-kit/icons/IcGlobe16';
import IcSwitch16 from '@tonkeeper/ui-kit/icons/IcSwitch16';
import { Cell, Cells, Group, Page } from '../kit';

const SORTING = [
    { value: 'market_cap', label: 'Market Cap' },
    { value: 'volume', label: 'Volume' },
    { value: 'top_gainers', label: 'Top Gainers' },
    { value: 'top_losers', label: 'Top Losers' }
];

const NETWORKS = [
    { value: 'all', label: 'All Networks' },
    { value: 'ton', label: 'TON' },
    { value: 'eth', label: 'Ethereum' },
    { value: 'tron', label: 'TRON' }
];

const SLIPPAGE = [50, 100, 300].map(bps => ({ value: bps, label: `${bps / 100}%` }));

export const DropdownStory = () => {
    const [sorting, setSorting] = useState('volume');
    const [network, setNetwork] = useState('all');
    const [slippage, setSlippage] = useState(100);
    return (
        <Page
            title="Dropdown"
            description="Checkmarked list of mutually exclusive options anchored to a trigger. `SelectPill` is the pill trigger; `Dropdown` takes any trigger. The menu opens above-centre or below-end and closes on pick or outside click."
            importLine="import { Dropdown, SelectPill } from '@tonkeeper/ui-kit'"
        >
            <Group title="SelectPill" note="Interactive — click a pill to open its menu">
                <Cells className="gap-x-16">
                    <Cell label="variant=tertiary · menuPosition=above-center">
                        <div className="flex h-[260px] w-[240px] items-end justify-center">
                            <SelectPill
                                value={sorting}
                                options={SORTING}
                                onChange={setSorting}
                                variant="tertiary"
                                menuPosition="above-center"
                                menuWidth={180}
                                className="shadow-lg"
                            />
                        </div>
                    </Cell>
                    <Cell label="variant=secondary · icon · menuPosition=below-end">
                        <div className="flex h-[260px] w-[240px] items-start justify-end">
                            <SelectPill
                                value={network}
                                options={NETWORKS}
                                onChange={setNetwork}
                                icon={<IcGlobe16 className="size-4" />}
                                menuPosition="below-end"
                            />
                        </div>
                    </Cell>
                </Cells>
            </Group>
            <Group title="Custom trigger" note="Dropdown anchored to a plain value">
                <div className="flex h-[200px] w-[240px] items-start justify-end">
                    <Dropdown
                        value={slippage}
                        options={SLIPPAGE}
                        onChange={setSlippage}
                        menuPosition="below-end"
                        menuWidth={140}
                        trigger={({ selected, open, toggle }) => (
                            <button
                                type="button"
                                aria-haspopup="menu"
                                aria-expanded={open}
                                onClick={toggle}
                                className="flex cursor-pointer items-center gap-1 text-label1 text-textPrimary transition-colors duration-100 hover:text-textSecondary"
                            >
                                {selected?.label}
                                <IcSwitch16 className="size-4 text-iconSecondary" />
                            </button>
                        )}
                    />
                </div>
            </Group>
        </Page>
    );
};
