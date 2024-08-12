export interface ProStateAuthorized {
    authorizedWallet: ProStateWallet;
    subscription: ProSubscription;
}

export interface ProStateNotAuthorized {
    authorizedWallet: null;
    subscription: ProSubscription;
}

export type ProState = ProStateAuthorized | ProStateNotAuthorized;

export interface ProStateWallet {
    publicKey: string;
    rawAddress: string;
}

export type ProSubscription = ProSubscriptionValid | ProSubscriptionInvalid;

export interface ProSubscriptionPaid {
    valid: true;
    isTrial: false;
    usedTrial: boolean;
    nextChargeDate: Date;
}

export interface ProSubscriptionTrial {
    trialUserId: number;
    valid: true;
    isTrial: true;
    trialEndDate: Date;
    usedTrial: true;
}

export type ProSubscriptionValid = ProSubscriptionPaid | ProSubscriptionTrial;

export interface ProSubscriptionInvalid {
    valid: false;
    isTrial: false;
    usedTrial: boolean;
}

export function isTrialSubscription(
    subscription: ProSubscription
): subscription is ProSubscriptionTrial {
    return subscription.isTrial && subscription.valid;
}

export function isValidSubscription(
    subscription: ProSubscription
): subscription is ProSubscriptionValid {
    return subscription.valid;
}

export function isPaidSubscription(
    subscription: ProSubscription
): subscription is ProSubscriptionPaid {
    return subscription.valid && !subscription.isTrial;
}
