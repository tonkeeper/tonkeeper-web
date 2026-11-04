import { FC, Fragment, PropsWithChildren, ReactNode } from 'react';

/**
 * The chrome of the migration screens, which render outside `AppLayout`
 * because they run before any wallet exists: a 520px card on a dimmed page on
 * desktop, and the whole viewport on a phone, with the text block taking the
 * free height and the actions at the bottom.
 */
export const MigrationCard: FC<
    PropsWithChildren<{
        title: ReactNode;
        subtitle?: ReactNode;
        description?: ReactNode;
        actions?: ReactNode;
    }>
> = ({ title, subtitle, description, actions, children }) => (
    <div className="bg-backgroundPage">
        <main className="flex min-h-[100dvh] flex-col sm:items-center sm:justify-center sm:bg-backgroundOverlayStrong sm:p-6">
            <div className="flex w-full flex-1 flex-col bg-backgroundPage pt-8 sm:w-[520px] sm:flex-none sm:overflow-hidden sm:rounded-[20px]">
                <div className="flex flex-1 flex-col justify-center sm:flex-none">
                    <div className="flex flex-col items-center gap-1 px-8 pb-4 text-center">
                        <h1 className="break-words text-h2 text-textPrimary">{title}</h1>
                        {subtitle && (
                            <p className="break-words text-body1 text-textSecondary">{subtitle}</p>
                        )}
                        {description && (
                            <p className="break-words text-body1 text-textSecondary">
                                {description}
                            </p>
                        )}
                    </div>
                    {children}
                </div>

                {actions && (
                    <div className="flex flex-col gap-4 p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
                        {actions}
                    </div>
                )}
            </div>
        </main>
    </div>
);

/** The value half of a subtitle such as "Found on wallet.tonkeeper.com". */
export const Emphasis: FC<PropsWithChildren> = ({ children }) => (
    <span className="text-textPrimary">{children}</span>
);

/**
 * A translated sentence with the host in the emphasis colour. The host is
 * substituted by `t()` and then found again, so the translation decides where
 * it sits.
 */
export const WithEmphasis: FC<{ text: string; value: string }> = ({ text, value }) => {
    const [before, ...rest] = text.split(value);

    if (rest.length === 0) {
        return <>{text}</>;
    }

    return (
        <>
            {before}
            {rest.map((after, index) => (
                <Fragment key={index}>
                    <Emphasis>{value}</Emphasis>
                    {after}
                </Fragment>
            ))}
        </>
    );
};
