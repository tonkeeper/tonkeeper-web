import React, { forwardRef } from 'react';
import { cn } from '../utils/cn';

export type LinkProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Link = forwardRef<HTMLButtonElement, LinkProps>(
    ({ className, type = 'button', ...rest }, ref) => (
        <button
            ref={ref}
            type={type}
            className={cn(
                'border-0 bg-transparent p-0 text-label2 text-accentBlue opacity-100 transition-opacity duration-150 ease-in-out hover:opacity-80 active:opacity-80',
                className
            )}
            {...rest}
        />
    )
);
Link.displayName = 'Link';
