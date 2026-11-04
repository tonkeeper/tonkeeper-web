import { screenshotEachMode } from '../../../../../playwright/test';
import { MultichainAssetInstrumentSheet } from './MultichainAssetInstrumentSheet';

// Modal renders as a centered dialog on desktop and a bottom sheet on
// mobile, so both modes are captured for each instrument variant.

screenshotEachMode(
    'MultichainAssetInstrumentSheet stocks',
    () => <MultichainAssetInstrumentSheet variant="stocks" isOpen onClose={() => {}} />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

screenshotEachMode(
    'MultichainAssetInstrumentSheet etfs',
    () => <MultichainAssetInstrumentSheet variant="etfs" isOpen onClose={() => {}} />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);
