import { useState } from 'react';

import { SegmentedControl } from './SegmentedControl';

export const SegmentedControlInteractiveStory = () => {
    const [value, setValue] = useState('a');

    return (
        <div className="w-[342px] rounded-medium bg-backgroundContent p-2">
            <SegmentedControl
                options={[
                    { value: 'a', label: 'Stocks' },
                    { value: 'b', label: 'ETFs' }
                ]}
                value={value}
                onChange={setValue}
            />
        </div>
    );
};
