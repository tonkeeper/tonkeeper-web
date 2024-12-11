/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type User = {
    id: number;
    /**
     * ID from the Telegram service
     */
    tg_id?: number;
    /**
     * TON wallet address
     */
    wallet_address?: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
    is_ban: boolean;
    invited_by?: number;
    referral_id: string;
    referrals_count: number;
    date_create: number;
};

