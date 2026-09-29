import { FC } from 'react';
import { cn } from '../utils/cn';

export interface ChainChipProps {
    label: string;
    className?: string;
}

export const ChainChip: FC<ChainChipProps> = ({ label, className }) => (
    <span
        className={cn(
            'inline-flex h-4 select-none items-center rounded-extraExtraSmall bg-backgroundContentTint px-1.5 text-[10px] font-medium uppercase leading-none tracking-wider text-textSecondary',
            className
        )}
    >
        {label}
    </span>
);
