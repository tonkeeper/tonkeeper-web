import { FC } from 'react';

import { MultichainActivity } from '@tonkeeper/core/dist/service/multichainActivityService';

import {
    formatHistoryTimestamp,
    groupMultichainActivities,
    historyGroupTitle
} from './multichain-history-utils';

// A fixed "now" so every relative-date branch is deterministic. Midday UTC on
// all fixtures keeps the calendar day stable across the runner's timezone.
const NOW = Date.parse('2026-07-15T12:00:00Z');

const at = (iso: string): MultichainActivity => ({
    activityType: 'receive',
    status: 'confirmed',
    blockTimeMs: Date.parse(iso),
    fromChain: 'ton',
    toChain: 'ton',
    direction: 'in',
    txIds: ['ton:0x1']
});

const TODAY = Date.parse('2026-07-15T09:30:00Z');
const YESTERDAY = Date.parse('2026-07-14T09:30:00Z');
const SAME_MONTH = Date.parse('2026-07-03T09:30:00Z');
const EARLIER_MONTH = Date.parse('2026-06-12T09:30:00Z');
const EARLIER_YEAR = Date.parse('2025-06-12T09:30:00Z');

const fmt = (ms: number) => formatHistoryTimestamp('en', ms, new Date(NOW));

export const TimestampProbe: FC = () => (
    <div>
        <span data-testid="ts-today">{fmt(TODAY)}</span>
        <span data-testid="ts-yesterday">{fmt(YESTERDAY)}</span>
        <span data-testid="ts-same-month">{fmt(SAME_MONTH)}</span>
        <span data-testid="ts-earlier-month">{fmt(EARLIER_MONTH)}</span>
        <span data-testid="ts-earlier-year">{fmt(EARLIER_YEAR)}</span>
        <span data-testid="ts-today-with-date">
            {formatHistoryTimestamp('en', TODAY, new Date(NOW), true)}
        </span>
        <span data-testid="ts-same-month-with-date">
            {formatHistoryTimestamp('en', SAME_MONTH, new Date(NOW), true)}
        </span>
    </div>
);

export const GroupProbe: FC = () => {
    const keys = groupMultichainActivities(
        [
            at('2026-07-15T09:30:00Z'),
            at('2026-07-14T09:30:00Z'),
            at('2026-07-08T09:30:00Z'),
            at('2026-07-03T09:30:00Z'),
            at('2026-06-12T09:30:00Z'),
            at('2025-06-12T09:30:00Z')
        ],
        new Date(NOW)
    ).map(([key]) => key);
    return (
        <div>
            <span data-testid="group-keys">{keys.join(',')}</span>
        </div>
    );
};

export const TitleProbe: FC = () => (
    <div>
        <span data-testid="title-today">{historyGroupTitle('en', 'today', TODAY)}</span>
        <span data-testid="title-yesterday">{historyGroupTitle('en', 'yesterday', YESTERDAY)}</span>
        <span data-testid="title-month">
            {historyGroupTitle('en', 'month-12', Date.parse('2026-07-12T12:00:00Z'))}
        </span>
    </div>
);
