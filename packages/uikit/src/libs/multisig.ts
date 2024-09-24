export const multisigOrderLifetimeMinutes = {
    '30': 'multisig_lifetime_30_minutes',
    '60': 'multisig_lifetime_60_minutes',
    '360': 'multisig_lifetime_360_minutes',
    '720': 'multisig_lifetime_720_minutes',
    '1440': 'multisig_lifetime_1440_minutes'
} as const;

export type MultisigOrderLifetimeMinutes = keyof typeof multisigOrderLifetimeMinutes;
