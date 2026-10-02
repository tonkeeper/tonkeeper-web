import { FC, Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { useTranslation } from '../hooks/translation';
import { useMutateUserUIPreferences, useUserUIPreferences } from '../state/theme';
import { DropDownContent, DropDownItem, DropDownItemsDivider } from './DropDown';
import { SwitchIcon } from './Icon';
import { FullHeightBlock, Notification } from './Notification';
import { Body3, Label2 } from './Text';
import { SelectDropDown, SelectDropDownHost, SelectDropDownHostText } from './fields/Select';
import { ScanQR, VideoInputDevice } from './shared/ScanQR';

const Block = styled.div`
    margin: 0 -1rem;
    width: calc(100% + 2rem);
`;

const CameraSelectWrapper = styled.div`
    width: 100%;
    box-sizing: border-box;
    margin-top: 1rem;
`;

const CameraSelectHost = styled(SelectDropDownHost)`
    background: ${p => p.theme.fieldBackground};
    cursor: pointer;
`;

const CameraLabel = styled(Label2)`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const CameraSelect: FC<{
    cameras: VideoInputDevice[];
    activeDeviceId: string | undefined;
    onSelect: (deviceId: string) => void;
}> = ({ cameras, activeDeviceId, onSelect }) => {
    const { t } = useTranslation();

    const activeCamera = cameras.find(camera => camera.deviceId === activeDeviceId) ?? cameras[0];

    return (
        <CameraSelectWrapper>
            <SelectDropDown
                right="0"
                bottom="0"
                width="100%"
                payload={onClose => (
                    <DropDownContent>
                        {cameras.map((camera, index) => (
                            <Fragment key={camera.deviceId || index}>
                                <DropDownItem
                                    isSelected={camera.deviceId === activeCamera?.deviceId}
                                    onClick={() => {
                                        onClose();
                                        onSelect(camera.deviceId);
                                    }}
                                >
                                    <CameraLabel>{camera.label}</CameraLabel>
                                </DropDownItem>
                                <DropDownItemsDivider />
                            </Fragment>
                        ))}
                    </DropDownContent>
                )}
            >
                <CameraSelectHost>
                    <SelectDropDownHostText>
                        <Body3>{t('scan_qr_camera')}</Body3>
                        <CameraLabel>{activeCamera?.label}</CameraLabel>
                    </SelectDropDownHostText>
                    <SwitchIcon />
                </CameraSelectHost>
            </SelectDropDown>
        </CameraSelectWrapper>
    );
};

const QrScanner = () => {
    const [scanId, setScanId] = useState<number | undefined>(undefined);
    const sdk = useAppSdk();
    const { standalone } = useAppContext();
    const { t } = useTranslation();

    const { data: uiPreferences } = useUserUIPreferences();
    const { mutate: mutateUIPreferences } = useMutateUserUIPreferences();

    const [cameras, setCameras] = useState<VideoInputDevice[]>([]);
    const [activeDeviceId, setActiveDeviceId] = useState<string | undefined>(undefined);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
    const deviceId = selectedDeviceId ?? uiPreferences?.preferredCameraId;

    useEffect(() => {
        const handler = (options: { method: 'scan'; id?: number | undefined }) => {
            setScanId(options.id);
        };
        sdk.uiEvents.on('scan', handler);
        return () => {
            sdk.uiEvents.off('scan', handler);
        };
    }, [sdk.uiEvents]);

    const onCancel = () => {
        setScanId(undefined);
    };

    const onScan = useMemo(() => {
        return (data: string) => {
            // Close first: a listener may synchronously request another scan (e.g. the next part
            // of an animated QR code), and that request has to win over closing the scanner.
            setScanId(undefined);
            sdk.uiEvents.emit('response', {
                method: 'response',
                id: scanId,
                params: data
            });
        };
    }, [sdk, scanId, setScanId]);

    const onError = useCallback(
        (e: Error) => {
            sdk.uiEvents.emit('copy', {
                method: 'copy',
                id: scanId,
                params: e.message
            });
        },
        [sdk, scanId]
    );

    const onCameras = useCallback((list: VideoInputDevice[], active: string) => {
        setCameras(list);
        setActiveDeviceId(active);
    }, []);

    const onSelectCamera = useCallback(
        (id: string) => {
            setSelectedDeviceId(id);
            setActiveDeviceId(id);
            mutateUIPreferences({ preferredCameraId: id });
        },
        [mutateUIPreferences]
    );

    const isOpen = scanId !== undefined;

    const Content = useCallback(() => {
        return (
            <FullHeightBlock standalone={standalone}>
                <Block>
                    {isOpen && (
                        <ScanQR
                            deviceId={deviceId}
                            onCameras={onCameras}
                            onScan={onScan}
                            onError={onError}
                        />
                    )}
                </Block>
                {isOpen && cameras.length > 1 && (
                    <CameraSelect
                        cameras={cameras}
                        activeDeviceId={activeDeviceId}
                        onSelect={onSelectCamera}
                    />
                )}
            </FullHeightBlock>
        );
    }, [
        isOpen,
        standalone,
        deviceId,
        onCameras,
        onScan,
        onError,
        cameras,
        activeDeviceId,
        onSelectCamera
    ]);

    return (
        <Notification isOpen={isOpen} handleClose={onCancel} title={t('scan_qr_title')}>
            {Content}
        </Notification>
    );
};

export default QrScanner;
