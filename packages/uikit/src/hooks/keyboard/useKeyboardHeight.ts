import { useEffect, useState } from 'react';
import { useAppSdk } from '../appSdk';

export const useKeyboardHeight = () => {
    const [height, setHeight] = useState(0);

    const sdk = useAppSdk();
    useEffect(() => {
        const showUnsubscribe = sdk.keyboard.willShow.subscribe(info =>
            setHeight(info.keyboardHeight)
        );
        const hideUnsubscribe = sdk.keyboard.willHide.subscribe(() => setHeight(0));

        return () => {
            showUnsubscribe();
            hideUnsubscribe();
        };
    }, []);

    return height;
};
