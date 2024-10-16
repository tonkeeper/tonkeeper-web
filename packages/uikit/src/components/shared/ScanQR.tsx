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

interface Props {
    className?: string | undefined;
    delay?: number;
    onError?: undefined | ((error: Error) => void);
    onScan: (data: string) => void;
    size?: string | number | undefined;
    style?: React.CSSProperties | undefined;
}

const DEFAULT_DELAY = 150;

function Scan({
    className = '',
    delay = DEFAULT_DELAY,
    onError = console.error,
    onScan,
    size,
    style = {}
}: Props): React.ReactElement<Props> {
    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsRef = useRef<IScannerControls | null>(null);

    const containerStyle = useMemo(() => createImgSize(size), [size]);

    const _onError = useCallback((error: Error) => onError(error), [onError]);

    useEffect(() => {
        const codeReader = new BrowserQRCodeReader();

        const startScanning = async () => {
            try {
                const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
                const selectedDeviceId = videoInputDevices[0].deviceId;

                controlsRef.current = await codeReader.decodeFromVideoDevice(
                    selectedDeviceId,
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
            } catch (error) {
                _onError(error instanceof Error ? error : new Error('Unknown error occurred'));
            }
        };

        const timeoutId = setTimeout(startScanning, delay);

        return () => {
            clearTimeout(timeoutId);

            if (controlsRef.current) {
                controlsRef.current.stop();
            }
        };
    }, [onScan, _onError, delay]);

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
