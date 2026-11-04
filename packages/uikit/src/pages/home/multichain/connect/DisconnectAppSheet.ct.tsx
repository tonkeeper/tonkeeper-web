import { screenshotEachMode } from '../../../../../playwright/test';
import { DisconnectAppSheet } from './DisconnectAppSheet';

const ICON =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><rect width="72" height="72" fill="%23ff007a"/></svg>';

screenshotEachMode(
    'DisconnectAppSheet',
    () => (
        <DisconnectAppSheet
            isOpen
            appName="Uniswap"
            appIcon={ICON}
            onDisconnect={() => {}}
            onCancel={() => {}}
        />
    ),
    ['desktop', 'mobile'],
    { target: 'dialog' }
);
