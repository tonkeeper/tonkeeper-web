import { useEffect, useRef, useState } from 'react';

export const useToQueryKeyPart = (obj: unknown): string => {
    const keyRef = useRef(`stable-${Math.random().toString(36).slice(2)}`);
    const [version, setVersion] = useState(0);
    const lastObj = useRef(obj);

    useEffect(() => {
        if (lastObj.current !== obj) {
            lastObj.current = obj;
            setVersion(v => v + 1);
        }
    }, [obj]);

    return `${keyRef.current}-${version}`;
};
