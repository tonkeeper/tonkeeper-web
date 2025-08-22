import { createModalControl } from './createModalControl';
import React from 'react';
import { TopUpTronFeeBalance } from '../jettons/TopUpTronFeeBalance';

const { hook } = createModalControl();

export const useTopUpTronFeeBalanceNotification = hook;

export const TopUpTronFeeBalanceNotificationControlled = () => {
    const { isOpen, onClose } = useTopUpTronFeeBalanceNotification();

    return <TopUpTronFeeBalance isOpen={isOpen} onClose={onClose} />;
};
