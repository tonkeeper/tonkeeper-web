import { FC, useState } from 'react';

import { MultichainFiltersSheet } from './MultichainFiltersSheet';

/**
 * CT mount wrapper: the sheet's toggles are controlled, and Playwright's
 * static mount-loader can't resolve component wrappers defined inside the
 * test file itself.
 */
export const MultichainFiltersSheetHarness: FC<{ onChange?: (checked: boolean) => void }> = ({
    onChange
}) => {
    const [checked, setChecked] = useState(false);
    const [open, setOpen] = useState(true);

    return (
        <div className="h-[420px] w-[390px] bg-backgroundPage">
            <MultichainFiltersSheet
                isOpen={open}
                onClose={() => setOpen(false)}
                toggles={[
                    {
                        title: 'Hide tiny transfers',
                        subtitle: 'Transfers worth less than $0.01.',
                        checked,
                        onChange: next => {
                            setChecked(next);
                            onChange?.(next);
                        }
                    }
                ]}
            />
        </div>
    );
};
