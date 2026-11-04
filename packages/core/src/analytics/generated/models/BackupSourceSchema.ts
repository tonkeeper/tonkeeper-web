/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Where the recovery-phrase backup flow was entered from:
 *
 * - onboarding: right after wallet creation, inside the create flow
 * - wallet_setup_section: "Back up your recovery phrase" card in the
 * "Finish setting up" wallet-setup section on the wallet main screen
 * - settings: Settings → Backup → Back Up Manually
 * - deep_link: opened by a tonkeeper:// / https:// backup deep link
 * (e.g. tonkeeper://backup), not from Settings UI
 *
 */
export type BackupSourceSchema = 'onboarding' | 'wallet_setup_section' | 'settings' | 'deep_link';
