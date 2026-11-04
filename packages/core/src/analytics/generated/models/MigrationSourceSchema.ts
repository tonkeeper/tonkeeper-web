/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Entry point that opened the migration flow. Lets the migration funnel be segmented by where users came from without joining to placement config.
 * - settings - Settings → Migration - onboarding - the migration step shown after creating a multichain
 * wallet in onboarding, when legacy TON wallets with assets exist
 * - setup - "Migrate assets from your TON wallets" card in the
 * "Finish setting up" section on the wallet main screen
 * - story - an in-app Story button - banner - a promo banner on the wallet screen - raffle - the Mystery Raffle modal CTA ("Migrate to Get Tickets") - deeplink - a bare `migration` deeplink from anywhere else
 * (push notification, external link)
 *
 */
export type MigrationSourceSchema = 'settings' | 'onboarding' | 'setup' | 'story' | 'banner' | 'raffle' | 'deeplink';
