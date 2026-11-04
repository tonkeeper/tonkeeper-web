import { FC, ReactNode } from 'react';

import { cn } from '../../../libs/css';

export const MultichainDetailCell: FC<{
    label: ReactNode;
    value: ReactNode;
    sub?: ReactNode;
    last?: boolean;
    valueClassName?: string;
}> = ({ label, value, sub, last, valueClassName }) => (
    <div className={last ? '' : 'border-b border-separatorCommon'}>
        <div className="flex min-h-[56px] flex-col justify-center px-4 py-2">
            <div className="flex items-start gap-2">
                <span className="whitespace-nowrap text-body1 text-textSecondary">{label}</span>
                <span
                    className={cn(
                        'min-w-0 flex-1 break-words text-right text-label1 text-textPrimary',
                        valueClassName
                    )}
                >
                    {value}
                </span>
            </div>
            {sub && (
                <span className="break-words text-right text-body2 text-textSecondary">{sub}</span>
            )}
        </div>
    </div>
);
