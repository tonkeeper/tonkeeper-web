import { QrScanSignature } from '@polkadot/react-qr/ScanSignature';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAppSdk } from '../hooks/appSdk';
import { NotificationCancelButton } from './Notification';
import ReactPortal from './ReactPortal';

const Block = styled.div`
  position: fixed;
  inset: 0;
  z-index: 5;
  pointer-events: none;

  display: flex;
  align-items: center;
  justify-content: center;

  background: ${(props) => props.theme.backgroundPage};
`;

const ButtonPosition = styled.div`
  position: fixed;
  z-index: 6;
  top: 1rem;
  right: 50%;
`;

const QrScanner = () => {
  const [scanId, setScanId] = useState<number | undefined>(undefined);
  const sdk = useAppSdk();

  useEffect(() => {
    const handler = (options: { method: 'scan'; id?: number | undefined }) => {
      setScanId(options.id);
    };
    sdk.uiEvents.on('scan', handler);
    return () => {
      sdk.uiEvents.off('scan', handler);
    };
  }, []);

  const onCancel = () => {
    setScanId(undefined);
  };
  const onScan = ({ signature }: { signature: string }) => {
    signature = signature.slice(2);
    console.log(signature);
    setTimeout(() => {
      sdk.uiEvents.emit('copy', {
        method: 'copy',
        params: signature,
      });
    }, 1000);

    sdk.uiEvents.emit('response', {
      method: 'response',
      id: scanId,
      params: signature,
    });

    setScanId(undefined);
  };

  return (
    <ReactPortal wrapperId="qr-scanner">
      {scanId && (
        <>
          <ButtonPosition>
            <NotificationCancelButton handleClose={onCancel} />
          </ButtonPosition>
          <Block>
            <QrScanSignature onScan={onScan} />
          </Block>
        </>
      )}
    </ReactPortal>
  );
};

export default QrScanner;
