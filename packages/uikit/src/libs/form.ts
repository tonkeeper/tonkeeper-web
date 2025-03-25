import { FormEvent } from 'react';

export const handleSubmit = (callback: () => void) => {
    return (e: FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        callback();
    };
};
