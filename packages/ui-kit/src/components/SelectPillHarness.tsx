import { FC, useState } from 'react';

import IcGlobe16 from '../icons/components/IcGlobe16';
import { SelectPill, SelectPillProps } from './SelectPill';

const OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'btc', label: 'Bitcoin' },
    { value: 'eth', label: 'Ethereum' }
];

/**
 * CT mount wrapper: the pill is controlled, and Playwright's static
 * mount-loader can't resolve component wrappers defined inside the test
 * file itself.
 */
export const SelectPillHarness: FC<Pick<SelectPillProps<string>, 'variant' | 'menuPosition'>> = ({
    variant,
    menuPosition
}) => {
    const [value, setValue] = useState('all');
    return (
        <SelectPill
            value={value}
            options={OPTIONS}
            onChange={setValue}
            icon={variant === 'secondary' ? <IcGlobe16 className="size-4" /> : undefined}
            variant={variant}
            menuPosition={menuPosition}
        />
    );
};
