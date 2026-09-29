import { FC, ReactNode } from 'react';
import { cn } from '@tonkeeper/ui-kit';

export const Page: FC<{
    title: string;
    description?: ReactNode;
    importLine?: string;
    children: ReactNode;
}> = ({ title, description, importLine, children }) => (
    <article className="flex flex-col gap-10">
        <header className="flex flex-col gap-3">
            <h1 className="text-h1 text-textPrimary">{title}</h1>
            {description && (
                <p className="max-w-[720px] text-body1 text-textSecondary">{description}</p>
            )}
            {importLine && (
                <code className="w-fit rounded-small bg-backgroundContent px-3 py-2 font-mono text-body3 text-textSecondary">
                    {importLine}
                </code>
            )}
        </header>
        {children}
    </article>
);

export const Group: FC<{ title: string; note?: ReactNode; children: ReactNode }> = ({
    title,
    note,
    children
}) => (
    <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
            <h2 className="text-h3 text-textPrimary">{title}</h2>
            {note && <p className="text-body2 text-textSecondary">{note}</p>}
        </div>
        <div className="rounded-large border border-solid border-separatorCommon bg-backgroundPage p-6">
            {children}
        </div>
    </section>
);

export const Cells: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cn('flex flex-wrap items-start gap-x-8 gap-y-6', className)}>{children}</div>
);

export const Cell: FC<{ label: ReactNode; children: ReactNode; className?: string }> = ({
    label,
    children,
    className
}) => (
    <div className={cn('flex max-w-full flex-col gap-3', className)}>
        <div className="flex min-h-[24px] items-center">{children}</div>
        <span className="font-mono text-body3 text-textTertiary">{label}</span>
    </div>
);

/** Rows × columns grid; `render` draws the cell for one combination. */
export function Matrix<R extends string, C extends string>({
    rows,
    columns,
    render,
    rowHeader = r => r,
    columnHeader = c => c
}: {
    rows: readonly R[];
    columns: readonly C[];
    render: (row: R, column: C) => ReactNode;
    rowHeader?: (row: R) => ReactNode;
    columnHeader?: (column: C) => ReactNode;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="border-separate border-spacing-x-6 border-spacing-y-4">
                <thead>
                    <tr>
                        <th />
                        {columns.map(c => (
                            <th
                                key={c}
                                className="text-left font-mono text-body3 font-normal text-textTertiary"
                            >
                                {columnHeader(c)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map(r => (
                        <tr key={r}>
                            <th className="whitespace-nowrap pr-2 text-left align-middle font-mono text-body3 font-normal text-textTertiary">
                                {rowHeader(r)}
                            </th>
                            {columns.map(c => (
                                <td key={c} className="align-middle">
                                    {render(r, c)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export const SampleTokenIcon: FC<{ size?: 24 | 44 }> = ({ size = 44 }) => (
    <div
        className={cn(
            'rounded-full bg-gradient-to-br from-accentBlue to-accentPurple',
            size === 44 ? 'h-11 w-11' : 'h-6 w-6'
        )}
    />
);

export const noop = () => {};
