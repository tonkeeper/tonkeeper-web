import { FC, useState } from 'react';

import { BrowserSearchBar } from './BrowserSearchBar';

/**
 * CT mount wrapper: the component test needs a controlled value to type
 * into, and Playwright's static mount-loader can't resolve component
 * wrappers defined inside the test file itself.
 */
export const BrowserSearchBarHarness: FC<{ onOpenUrl: (url: string) => void }> = ({
    onOpenUrl
}) => {
    const [value, setValue] = useState('');
    return <BrowserSearchBar value={value} onChange={setValue} onOpenUrl={onOpenUrl} />;
};
