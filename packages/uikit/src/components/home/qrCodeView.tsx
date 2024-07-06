import UR from '@ngraveio/bc-ur/dist/ur';
import UREncoder from '@ngraveio/bc-ur/dist/urEncoder';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { styled } from 'styled-components';

export const QrWrapper = styled.div`
    width: 100%;
    padding-bottom: 100%;
    position: relative;
`;

function chunks<T>(arr: T[], len: number): T[][] {
    var chunks: T[][] = [],
        i = 0,
        n = arr.length;

    while (i < n) {
        chunks.push(arr.slice(i, (i += len)));
    }

    return chunks;
}

export const AnimatedQrCode: FC<{ message: string }> = React.memo(({ message }) => {
    const [value, setValue] = useState('');

    useEffect(() => {
        let arr = [...message];

        const items = chunks(arr, 256);

        if (items.length === 1) {
            setValue(message);
        } else {
            let count = 0;
            setInterval(() => {
                let current = items[count];
                setValue(current.join(''));

                // increment our counter
                count++;

                // reset counter if we reach end of array
                if (count === items.length) {
                    count = 0;
                }
            }, 100);
        }
    }, [message]);

    return (
        <QrWrapper>
            <QRCode
                size={400}
                value={value}
                qrStyle="dots"
                eyeRadius={{
                    inner: 2,
                    outer: 16
                }}
            />
        </QrWrapper>
    );
});

export const KeystoneAnimatedQRCode: FC<{ data: UR }> = ({ data }) => {
    const urEncoder = useMemo(() => {
        return new UREncoder(data);
    }, []);

    const [value, setValue] = useState(urEncoder.nextPart());

    useEffect(() => {
        const interval = setInterval(() => {
            setValue(urEncoder.nextPart().toUpperCase());
        }, 200);
        return () => {
            clearInterval(interval);
        };
    }, []);

    return (
        <QrWrapper>
            <QRCode
                size={400}
                value={value}
                qrStyle="dots"
                eyeRadius={{
                    inner: 2,
                    outer: 16
                }}
            />
        </QrWrapper>
    );
};
