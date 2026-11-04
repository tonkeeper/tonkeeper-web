import { BatteryLevel } from '@tonkeeper/core/dist/utils/battery';

import { screenshot } from '../../../../../playwright/test';
import { BatteryIconSize, BatteryLevelIcon } from './BatteryLevelIcon';

const LEVELS: BatteryLevel[] = ['negative', 'empty', 10, 25, 50, 75, 100];
const SIZES: BatteryIconSize[] = [34, 44, 128];

// One grid per drawn size: every level side by side, so a regression in the
// two-tone paint (body vs. accent charge, the red negative flash, the orange
// low level) shows up as a single diff.
screenshot('BatteryLevelIcon all levels', () => (
    <div className="flex flex-col gap-4 bg-backgroundPage p-4">
        {SIZES.map(size => (
            <div key={size} className="flex items-end gap-4">
                {LEVELS.map(level => (
                    <BatteryLevelIcon key={String(level)} level={level} size={size} />
                ))}
            </div>
        ))}
    </div>
));
