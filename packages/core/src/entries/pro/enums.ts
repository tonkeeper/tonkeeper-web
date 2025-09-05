export enum PurchaseStatuses {
    SUCCESS = 'success',
    PENDING = 'pending',
    CANCELED = 'cancelled'
}

export enum PurchaseErrors {
    INCORRECT_WALLET_TYPE = 'incorrect_wallet_type',
    PROMOCODE_ALREADY_USED = 'promocode_already_used',
    PURCHASE_FAILED = 'purchase_failed'
}

export enum IosSubscriptionStatuses {
    ACTIVE = 'active',
    EXPIRED = 'expired'
}

export enum ProductIds {
    MONTHLY = 'com.tonapps.tonkeeperpro.subscription.pro.monthly'
}

export enum IosEnvironmentTypes {
    SANDBOX = 'Sandbox'
}

export enum AuthTypes {
    WALLET = 'wallet',
    TELEGRAM = 'telegram'
}

export enum CryptoSubscriptionStatuses {
    ACTIVE = 'active',
    EXPIRED = 'expired',
    PENDING = 'pending'
}

export enum ExtensionSubscriptionStatuses {
    NOT_INITIALIZED = 'not_initialized',
    ACTIVE = 'active',
    EXPIRED = 'expired',
    CANCELLED = 'cancelled',
    INVALID = 'invalid'
}

export enum TelegramSubscriptionStatuses {
    ACTIVE = 'active',
    EXPIRED = 'expired'
}
