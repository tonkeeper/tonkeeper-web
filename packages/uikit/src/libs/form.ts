import { FormEvent } from 'react';

export const handleSubmit = (callback: () => void) => {
    return (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        callback();
    };
};
