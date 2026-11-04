import { FC, useState } from 'react';

import { WalletColorPicker } from './WalletColorPicker';

/** Holds the selection so the picker's `aria-pressed` state is testable. */
export const WalletColorPickerHarness: FC<{ initial: string }> = ({ initial }) => {
    const [colorId, setColorId] = useState(initial);
    return <WalletColorPicker value={colorId} onChange={setColorId} />;
};
