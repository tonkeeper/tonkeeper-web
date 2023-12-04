export interface GetStorageMessage {
    king: 'storage-get';
    key: string;
}

export interface SetStorageMessage {
    king: 'storage-set';
    key: string;
    value: unknown;
}

export interface SetBatchStorageMessage {
    king: 'storage-set-batch';
    value: Record<string, unknown>;
}

export interface DeleteStorageMessage {
    king: 'storage-delete';
    key: string;
}

export interface ClearStorageMessage {
    king: 'storage-clear';
}

export interface OpenPageMessage {
    king: 'open-page';
    url: string;
}

export type Message =
    | GetStorageMessage
    | SetStorageMessage
    | SetBatchStorageMessage
    | DeleteStorageMessage
    | ClearStorageMessage
    | OpenPageMessage;
