/* generated using openapi-typescript-codegen -- do no edit */
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
    /**
     * Authorization token
     */
    token?: string;
    date_create: number;
};

