import { createModalControl } from './createModalControl';
import React from 'react';
import { BuyNotification } from '../home/BuyAction';
import { useTonendpointBuyMethods } from '../../state/tonendpoint';

const { hook } = createModalControl();

export const useBuyNotification = hook;

export const BuyNotificationControlled = () => {
    const { isOpen, onClose } = useBuyNotification();
    const { data } = useTonendpointBuyMethods();

    return <BuyNotification buy={data} open={isOpen} handleClose={onClose} />;
};
