/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A user opened an in-app Story.
 */
export type StoryOpenSchema = {
    eventName: string;
    /**
     * Backend-defined identifier of the opened story. Open vocabulary; values seen in production include new_deposit, staking, swaps, onboarding, usdt_trc20, aeon, fee_usdt_trc20.
     *
     */
    story_id: string;
    /**
     * Where the story was opened from:
     *
     * - wallet: the wallet main screen (dominant source)
     * - deep-link: opened via a deep link
     * - updates: the Updates / What's-new surface (iOS only)
     *
     * NOTE: `deep-link` is emitted with a hyphen here, unlike the
     * repo-wide `deep_link` (underscore) convention used by the other
     * flows — a normalization candidate.
     *
     */
    from: 'wallet' | 'deep-link' | 'updates';
};

