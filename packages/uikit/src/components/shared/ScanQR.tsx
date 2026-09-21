import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import styled, { css } from 'styled-components';

export function createImgSize(size?: string | number): Record<string, string> {
    if (!size) {
        return {
            aspectRatio: '1 / 1',
            width: '100%'
        };
    }

    const height = typeof size === 'string' ? size : `${size}px`;

    return {
        height,
        width: height
    };
}

export interface VideoInputDevice {
    deviceId: string;
    label: string;
}

interface Props {
    className?: string | undefined;
    delay?: number;
    /**
     * Camera to use. Falls back to the automatic choice when the device is not available anymore.
     */
    deviceId?: string | undefined;
    onError?: undefined | ((error: Error) => void);
    /**
     * Reports the cameras available on the device and the one the scanner is currently using.
     */
    onCameras?: undefined | ((cameras: VideoInputDevice[], activeDeviceId: string) => void);
    onScan: (data: string) => void;
    size?: string | number | undefined;
    style?: React.CSSProperties | undefined;
}

const DEFAULT_DELAY = 150;

const listCameras = async (): Promise<VideoInputDevice[]> => {
    const devices = await BrowserQRCodeReader.listVideoInputDevices();
    return devices.map(({ deviceId, label }) => ({ deviceId, label }));
};

const pickCamera = (cameras: VideoInputDevice[], preferredDeviceId?: string) => {
    const preferred = preferredDeviceId
        ? cameras.find(camera => camera.deviceId === preferredDeviceId)
        : undefined;

    if (preferred) {
        return preferred;
    }

    // Prefer the back camera
    const backCamera = cameras.find(
        camera => camera.label.toLowerCase().includes('back') || camera.deviceId.includes('camera')
    );

    return backCamera ?? cameras[0];
};

function Scan({
    className = '',
    delay = DEFAULT_DELAY,
    deviceId,
    onError = console.error,
    onCameras,
    onScan,
    size,
    style = {}
}: Props): React.ReactElement<Props> {
    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsRef = useRef<IScannerControls | null>(null);
    const onCamerasRef = useRef(onCameras);
    onCamerasRef.current = onCameras;

    const containerStyle = useMemo(() => createImgSize(size), [size]);

    const _onError = useCallback((error: Error) => onError(error), [onError]);

    useEffect(() => {
        const codeReader = new BrowserQRCodeReader();
        let disposed = false;
        let activeDeviceId: string | undefined;

        const startScanning = async () => {
            try {
                const cameras = await listCameras();
                if (cameras.length === 0) {
                    throw new Error('No camera found');
                }

                const selectedCamera = pickCamera(cameras, deviceId);
                activeDeviceId = selectedCamera.deviceId;
                onCamerasRef.current?.(cameras, selectedCamera.deviceId);

                const controls = await codeReader.decodeFromVideoDevice(
                    selectedCamera.deviceId,
                    videoRef.current ?? undefined,
                    (result, error) => {
                        if (result) {
                            onScan(result.getText());
                        }

                        if (error && !(error instanceof Error)) {
                            _onError(new Error(error));
                        }
                    }
                );

                if (disposed) {
                    controls.stop();
                    return;
                }
                controlsRef.current = controls;

                // Device labels are exposed only after the camera permission has been granted,
                // so refresh the list once the stream is running to show the real camera names.
                const camerasWithLabels = await listCameras();
                if (!disposed) {
                    onCamerasRef.current?.(camerasWithLabels, selectedCamera.deviceId);
                }
            } catch (error) {
                _onError(error instanceof Error ? error : new Error('Unknown error occurred'));
            }
        };

        const timeoutId = setTimeout(startScanning, delay);

        const onDeviceChange = async () => {
            try {
                const cameras = await listCameras();
                if (!disposed && cameras.length > 0) {
                    onCamerasRef.current?.(
                        cameras,
                        activeDeviceId ?? pickCamera(cameras, deviceId).deviceId
                    );
                }
            } catch (error) {
                console.error(error);
            }
        };
        navigator.mediaDevices?.addEventListener?.('devicechange', onDeviceChange);

        return () => {
            disposed = true;
            clearTimeout(timeoutId);
            navigator.mediaDevices?.removeEventListener?.('devicechange', onDeviceChange);

            if (controlsRef.current) {
                controlsRef.current.stop();
                controlsRef.current = null;
            }
        };
    }, [onScan, _onError, delay, deviceId]);

    return (
        <StyledDiv className={className} style={containerStyle} windowWidth={window.innerWidth}>
            <video ref={videoRef} style={style} />
        </StyledDiv>
    );
}

const StyledDiv = styled.div<{ windowWidth: number }>`
    overflow: hidden;
    position: relative;

    &::before {
        z-index: 0;
        content: '';
        display: block;
        position: absolute;
        inset: 0;
        background: ${p => p.theme.textSecondary};
    }

    &::after {
        z-index: 2;
        content: '';
        display: block;
        position: absolute;
        inset: 0;
        border: 50px solid ${p => p.theme.backgroundOverlayLight};
        box-shadow: ${p => p.theme.textTertiary} 0 0 0 5px inset;
    }

    video {
        z-index: 1;
        position: relative;
        display: inline-block;
        height: 100%;
        transform: matrix(-1, 0, 0, 1, 0, 0);
        width: 100%;
        object-fit: cover;

        ${props =>
            props.windowWidth <= 440 &&
            css`
                transform: none !important;
            `}
    }
`;

export const ScanQR = memo(Scan);
