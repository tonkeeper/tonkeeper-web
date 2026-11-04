import { screenshotEachMode } from '../../../../../playwright/test';
import { MultichainAssetVerificationSheet } from './MultichainAssetVerificationSheet';

// Modal renders as a centered dialog on desktop and a bottom sheet on
// mobile, so both modes are captured. Verified shows the seal icon +
// disclaimer; unverified swaps the icon for the bullet card of reasons.

screenshotEachMode(
    'MultichainAssetVerificationSheet verified',
    () => <MultichainAssetVerificationSheet variant="verified" isOpen onClose={() => {}} />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

screenshotEachMode(
    'MultichainAssetVerificationSheet unverified',
    () => <MultichainAssetVerificationSheet variant="unverified" isOpen onClose={() => {}} />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);
