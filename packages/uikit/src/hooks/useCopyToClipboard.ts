import { useRef, useState } from 'react';
import { useAppSdk } from './appSdk';

export function useCopyToClipboard(content: string, timeoutMS = 2000) {
    const [copied, setIsCopied] = useState(false);
    const sdk = useAppSdk();

    const timeoutId = useRef<ReturnType<typeof setTimeout> | undefined>();
    const onCopy = () => {
        clearTimeout(timeoutId.current);
        sdk.copyToClipboard(content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), timeoutMS);
    };

    return { onCopy, copied };
}
