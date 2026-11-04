import { FC, ReactNode } from 'react';
import { cn } from '../../libs/css';
import IcDonemarkOutline28 from '../../icons/components/IcDonemarkOutline28';
import IcExclamationmarkCircle28 from '../../icons/components/IcExclamationmarkCircle28';

/**
 * Replaces a confirm button in a modal footer once the action has settled:
 * a green check with the success caption, or a red mark with the failure one.
 * Same 56px height as the large button so the footer doesn't jump.
 */
export const ConfirmActionResult: FC<{
    variant: 'done' | 'error';
    label: ReactNode;
    className?: string;
}> = ({ variant, label, className }) => (
    <div
        className={cn(
            'flex h-14 items-center justify-center gap-2',
            variant === 'done' ? 'text-accentGreen' : 'text-accentRed',
            className
        )}
    >
        {variant === 'done' ? (
            <IcDonemarkOutline28 className="h-7 w-7" />
        ) : (
            <IcExclamationmarkCircle28 className="h-7 w-7" />
        )}
        <span className="text-label1">{label}</span>
    </div>
);
