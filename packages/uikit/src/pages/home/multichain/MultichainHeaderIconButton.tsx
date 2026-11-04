import { FC, ReactNode } from 'react';

import { cn } from '../../../libs/css';
import { Button, ButtonProps } from '../../../primitives';

export interface MultichainHeaderIconButtonProps
    extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children' | 'size'> {
    label: string;
    icon: ReactNode;
}

export const MultichainHeaderIconButton: FC<MultichainHeaderIconButtonProps> = ({
    label,
    icon,
    className,
    variant = 'secondary',
    ...rest
}) => (
    <Button
        aria-label={label}
        variant={variant}
        size="small"
        leftIcon={icon}
        className={cn('size-8 rounded-medium p-0', className)}
        {...rest}
    />
);
