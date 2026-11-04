import { FC } from 'react';

import IcExclamationmarkCircle16 from '../../../../icons/components/IcExclamationmarkCircle16';

/**
 * Callout shown in the destructive confirmation sheets when the paid Pro
 * subscription is about to be lost with the keys being erased. Pro access
 * only comes back once the subscribed wallet is signed in again, so the
 * consequence is spelled out before the action is confirmed.
 */
export const ProSubscriptionWarning: FC<{ text: string }> = ({ text }) => (
    <div className="mb-2 flex w-full items-center justify-between gap-6 rounded-small bg-[color-mix(in_srgb,var(--tk-accent-orange)_16%,transparent)] py-2 pl-3 pr-4 text-left text-body3 text-accentOrange">
        <span>{text}</span>
        <IcExclamationmarkCircle16 className="size-4 shrink-0" />
    </div>
);
