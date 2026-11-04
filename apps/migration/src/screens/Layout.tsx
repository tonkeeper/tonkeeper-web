import { FC, Fragment, PropsWithChildren, ReactNode } from 'react';

import chevronLeftUrl from '../../../../packages/uikit/src/icons/svg/ic-chevron-left-16.svg';
import appIconUrl from '../assets/app-icon.png';
import lockIconUrl from '../assets/ic-lock-128.svg';
import { MessageKey, t, tParts } from '../i18n';

/**
 * The chrome every screen shares: a 520px card centred on a dimmed page on
 * desktop, and the whole viewport on a phone — where the text block takes the
 * free height and the actions sit at the bottom, in reach of a thumb. The
 * action bar stays pinned while a long body (a 24-word phrase, a long wallet
 * list) scrolls under it.
 */
export const Layout: FC<
    PropsWithChildren<{
        header?: ReactNode;
        icon?: ReactNode;
        title: ReactNode;
        subtitle?: ReactNode;
        description?: ReactNode;
        actions?: ReactNode;
    }>
> = ({ header, icon, title, subtitle, description, actions, children }) => (
    <main className="flex min-h-[100dvh] flex-col bg-backgroundPage sm:items-center sm:justify-center sm:bg-backgroundBackdrop sm:p-6">
        <div className="flex w-full flex-1 flex-col bg-backgroundPage sm:w-[520px] sm:flex-none sm:overflow-hidden sm:rounded-[20px]">
            {header ?? <div className="h-8 shrink-0" />}

            <div className="flex flex-1 flex-col justify-center sm:flex-none">
                <div className="flex flex-col items-center">
                    {icon && <div className="flex pb-4">{icon}</div>}
                    <div className="flex w-full flex-col items-center gap-1 px-8 pb-4 text-center">
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
                </div>
                {children}
            </div>

            {actions && (
                <div className="sticky bottom-0 flex flex-col gap-4 bg-backgroundPage p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
                    {actions}
                </div>
            )}
        </div>
    </main>
);

const BACK_BUTTON_CLASS =
    'm-2 flex size-8 cursor-pointer items-center justify-center rounded-2xl bg-buttonSecondaryBackground transition-colors hover:bg-buttonSecondaryBackgroundHighlighted';

/** The card's top row with a back control, in place of the plain top padding. */
export const BackHeader: FC<{ href?: string; onClick?: () => void }> = ({ href, onClick }) => {
    const icon = <img src={chevronLeftUrl} alt="" className="block size-4" />;

    return (
        <div className="flex shrink-0 p-2">
            {href ? (
                <a href={href} aria-label={t('back')} className={BACK_BUTTON_CLASS}>
                    {icon}
                </a>
            ) : (
                <button
                    type="button"
                    onClick={onClick}
                    aria-label={t('back')}
                    className={BACK_BUTTON_CLASS}
                >
                    {icon}
                </button>
            )}
        </div>
    );
};

/** The value half of a subtitle such as "New address: web.keeperwallet.com". */
export const Emphasis: FC<PropsWithChildren> = ({ children }) => (
    <span className="text-textPrimary">{children}</span>
);

/** A translated sentence with elements in place of its placeholders. */
export const Trans: FC<{ k: MessageKey; parts: Record<string, ReactNode> }> = ({ k, parts }) => (
    <>
        {tParts(k, parts).map((part, index) => (
            <Fragment key={index}>{part}</Fragment>
        ))}
    </>
);

export const AppIcon: FC = () => (
    <span className="relative block size-32 shrink-0">
        <img
            src={appIconUrl}
            alt=""
            className="absolute left-4 top-4 size-24 rounded-[24px] bg-backgroundContent object-cover"
        />
    </span>
);

export const LockIcon: FC = () => (
    <img src={lockIconUrl} alt="" className="block size-32 shrink-0" />
);

const SPINNER_RADIUS = 10.75;
const SPINNER_CIRCUMFERENCE = 2 * Math.PI * SPINNER_RADIUS;

export const Spinner: FC = () => (
    <div className="flex h-14 items-center justify-center text-textPrimary">
        <svg
            className="animate-spin"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            role="progressbar"
            aria-label={t('loading')}
        >
            <circle
                cx={12}
                cy={12}
                r={SPINNER_RADIUS}
                stroke="currentColor"
                strokeOpacity={0.24}
                strokeWidth={2.5}
            />
            <circle
                cx={12}
                cy={12}
                r={SPINNER_RADIUS}
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray={SPINNER_CIRCUMFERENCE}
                strokeDashoffset={SPINNER_CIRCUMFERENCE * 0.7}
            />
        </svg>
    </div>
);

interface ButtonProps {
    onClick?: () => void;
    href?: string;
    type?: 'button' | 'submit';
    form?: string;
    disabled?: boolean;
}

const BASE_BUTTON_CLASS =
    'flex h-14 w-full shrink-0 cursor-pointer items-center justify-center rounded-2xl px-6 text-center text-label1 text-textPrimary transition-colors disabled:cursor-not-allowed disabled:text-white/[0.48]';

const button =
    (variant: string): FC<PropsWithChildren<ButtonProps>> =>
    ({ onClick, href, type = 'button', form, disabled, children }) => {
        const className = `${BASE_BUTTON_CLASS} ${variant}`;

        return href ? (
            <a href={href} className={className}>
                {children}
            </a>
        ) : (
            <button
                type={type}
                form={form}
                onClick={onClick}
                disabled={disabled}
                className={className}
            >
                {children}
            </button>
        );
    };

export const PrimaryButton = button(
    'bg-buttonPrimaryBackground hover:bg-buttonPrimaryBackgroundHighlighted disabled:bg-buttonPrimaryBackgroundDisabled'
);

export const SecondaryButton = button(
    'bg-buttonSecondaryBackground hover:bg-buttonSecondaryBackgroundHighlighted disabled:bg-buttonSecondaryBackgroundDisabled'
);

const TEXT_LINK_CLASS =
    'block w-full cursor-pointer px-4 pt-2 text-center text-body1 text-textAccent transition-opacity hover:opacity-80';

export const TextLink: FC<PropsWithChildren<{ href?: string; onClick?: () => void }>> = ({
    href,
    onClick,
    children
}) =>
    href ? (
        <a href={href} className={TEXT_LINK_CLASS}>
            {children}
        </a>
    ) : (
        <button type="button" onClick={onClick} className={TEXT_LINK_CLASS}>
            {children}
        </button>
    );
