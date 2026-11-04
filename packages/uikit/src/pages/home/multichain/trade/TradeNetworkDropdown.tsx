import { FC } from 'react';

import IcGlobe16 from '../../../../icons/components/IcGlobe16';
import { SelectPill } from '../SelectPill';

/**
 * Shelf network filter: the shared {@link SelectPill} carrying the shelf's
 * chain variants, with the globe glyph and the menu dropping under the pill's
 * right edge (it sits at the end of a shelf title row).
 */
export const TradeNetworkDropdown: FC<{
    value: string;
    options: string[];
    onChange: (value: string) => void;
}> = ({ value, options, onChange }) => (
    <SelectPill
        value={value}
        options={options.map(option => ({ value: option, label: option }))}
        onChange={onChange}
        icon={<IcGlobe16 className="size-4" />}
        menuPosition="below-end"
    />
);
