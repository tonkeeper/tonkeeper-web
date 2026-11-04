import { screenshotEachMode } from '../../../../../playwright/test';
import { ConnectRiskWarningSheet } from './ConnectRiskWarningSheet';

// The three Reown verify states: unknown (orange), domain mismatch and
// scam (red). Modal renders as a centered dialog on desktop and a
// bottom sheet on mobile.

screenshotEachMode(
    'ConnectRiskWarningSheet unknown',
    () => (
        <ConnectRiskWarningSheet
            isOpen
            risk="unknown"
            onConnectAnyway={() => {}}
            onCancel={() => {}}
        />
    ),
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

screenshotEachMode(
    'ConnectRiskWarningSheet mismatch',
    () => (
        <ConnectRiskWarningSheet
            isOpen
            risk="mismatch"
            onConnectAnyway={() => {}}
            onCancel={() => {}}
        />
    ),
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

screenshotEachMode(
    'ConnectRiskWarningSheet scam',
    () => (
        <ConnectRiskWarningSheet
            isOpen
            risk="scam"
            onConnectAnyway={() => {}}
            onCancel={() => {}}
        />
    ),
    ['desktop', 'mobile'],
    { target: 'dialog' }
);
