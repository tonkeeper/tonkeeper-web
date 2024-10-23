import { useEffect, useId, useState } from 'react';

export const useToQueryKeyPart = (value: unknown) => {
    const id = useId();
    const [count, setCount] = useState(0);
    useEffect(() => {
        setCount(c => c + 1);
    }, [value]);

    return id + count.toString();
};
