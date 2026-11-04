import { Children, FC, Fragment, ReactNode } from 'react';

import { cn } from '../../../../libs/css';
import IcChevronRight16 from '../../../../icons/components/IcChevronRight16';

/**
 * Rounded settings list container. Owns the group background so cells and
 * the inset dividers between them render on one surface.
 */
export const SettingsListGroup: FC<{ children: ReactNode; className?: string }> = ({
    children,
    className
}) => {
    const items = Children.toArray(children);
    return (
        <div className={cn('overflow-hidden rounded-medium bg-backgroundContent', className)}>
            {items.map((child, i) => (
                <Fragment key={i}>
                    {i > 0 && <div className="ml-4 h-[0.5px] bg-separatorCommon" />}
                    {child}
                </Fragment>
            ))}
        </div>
    );
};

export interface SettingsListCellProps {
    title: ReactNode;
    subtitle?: ReactNode;
    /** 44px round image/emoji slot rendered before the text block. */
    leftImage?: ReactNode;
    /** Status dot rendered after the title. */
    dot?: 'accent' | 'red';
    /**
     * Right accessory: accent text value, a 28px icon (tinted via
     * `iconTint`), a chevron, or an arbitrary node (e.g. a Switch).
     */
    rightText?: ReactNode;
    rightIcon?: ReactNode;
    rightIconTint?: 'accent' | 'secondary';
    chevron?: boolean;
    rightNode?: ReactNode;
    onClick?: () => void;
}

/**
 * One settings row. Interactive when `onClick` is given, static otherwise.
 */
export const SettingsListCell: FC<SettingsListCellProps> = ({
    title,
    subtitle,
    leftImage,
    dot,
    rightText,
    rightIcon,
    rightIconTint = 'accent',
    chevron,
    rightNode,
    onClick
}) => {
    const content = (
        <>
            {leftImage && <div className="shrink-0 py-4 pl-4">{leftImage}</div>}
            <div className="min-w-0 flex-1 p-4">
                <div className="flex items-center">
                    <span className="truncate text-label1 text-textPrimary">{title}</span>
                    {dot && (
                        <span
                            className={cn(
                                'ml-1 size-[7px] shrink-0 rounded-full',
                                dot === 'red' ? 'bg-accentRed' : 'bg-accentBlue'
                            )}
                        />
                    )}
                </div>
                {subtitle && (
                    <div className="truncate text-body2 text-textSecondary">{subtitle}</div>
                )}
            </div>
            {rightText !== undefined && (
                <div className="shrink-0 py-4 pr-4 text-right text-label1 text-textAccent">
                    {rightText}
                </div>
            )}
            {rightIcon && (
                <div
                    className={cn(
                        'flex shrink-0 items-center py-3.5 pr-4 [&>svg]:size-7',
                        rightIconTint === 'accent' ? 'text-accentBlue' : 'text-iconSecondary'
                    )}
                >
                    {rightIcon}
                </div>
            )}
            {chevron && (
                <div className="flex shrink-0 items-center py-4 pr-4">
                    <IcChevronRight16 className="size-4 text-iconTertiary" />
                </div>
            )}
            {rightNode && <div className="flex shrink-0 items-center py-4 pr-4">{rightNode}</div>}
        </>
    );

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className="group flex w-full cursor-pointer items-center text-left transition-colors duration-100 hover:bg-backgroundContentTint"
            >
                {content}
            </button>
        );
    }
    return <div className="flex w-full items-center">{content}</div>;
};
