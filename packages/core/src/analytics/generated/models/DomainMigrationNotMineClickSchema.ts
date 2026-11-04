/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Sent when the user picks what to do after saying the arrived wallets are not theirs.
 *
 */
export type DomainMigrationNotMineClickSchema = {
    eventName: string;
    /**
     * `move_manually` - opens the old domain's recovery page in a new tab to move wallets by their recovery phrase. `continue_without` - opens the wallet without importing.
     *
     */
    action: 'move_manually' | 'continue_without';
};

