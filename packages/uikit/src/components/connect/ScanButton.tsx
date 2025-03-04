import React from 'react';
import styled from 'styled-components';
import { ScanIcon } from '../Icon';
import { useSmartScanner } from '../../hooks/useSmartScanner';

const ScanBlock = styled.div`
    position: absolute;
    right: 1rem;
    top: 1rem;

    color: ${props => props.theme.accentBlue};
`;

export const ScanButton = () => {
    const { onScan, NotificationComponent } = useSmartScanner();

    return (
        <>
            <ScanBlock onClick={onScan}>
                <ScanIcon />
            </ScanBlock>
            {NotificationComponent}
        </>
    );
};
