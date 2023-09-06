import { IStorage, MemoryStorage } from '@tonkeeper/core/dist/Storage';
import React, { useContext } from 'react';

export const StorageContext = React.createContext<IStorage>(new MemoryStorage());

/**
 * @deprecated use sdk storage
 */
export const useStorage = () => {
    return useContext(StorageContext);
};
