import { FC } from 'react';

const WalletGlyph: FC = () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
            d="M4 8.5A2.5 2.5 0 0 1 6.5 6h10A2.5 2.5 0 0 1 19 8.5V9h.5A2.5 2.5 0 0 1 22 11.5v5A2.5 2.5 0 0 1 19.5 19h-13A2.5 2.5 0 0 1 4 16.5v-8Zm2 0v8a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-5a.5.5 0 0 0-.5-.5h-13a2.5 2.5 0 0 1-.5-.05V8.5Zm11 3.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
            fill="currentColor"
        />
    </svg>
);

/**
 * The account's avatar. A unicode emoji renders as itself; the wallet's
 * `custom:*` tokens name SVG icons that live in `uikit`, which this app does
 * not carry, so they all fall back to one neutral glyph. The avatar only has to
 * tell rows apart — the name and the address do the identifying.
 */
export const WalletAvatar: FC<{ emoji: string; inline?: boolean }> = ({ emoji, inline }) =>
    inline ? (
        <span className="inline-flex size-5 shrink-0 items-center justify-center text-body1 leading-none text-textSecondary">
            {emoji.startsWith('custom:') ? <WalletGlyph /> : emoji}
        </span>
    ) : (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-backgroundContentTint text-2xl leading-none text-textPrimary">
            {emoji.startsWith('custom:') ? <WalletGlyph /> : emoji}
        </span>
    );
