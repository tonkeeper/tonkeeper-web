import { screenshot } from '../../../../../playwright/test';
import { ProSubscriptionWarning } from './ProSubscriptionWarning';

screenshot('ProSubscriptionWarning', () => (
    <ProSubscriptionWarning text="After deleting the wallet, PRO features will become unavailable. They will be restored after logging in with a wallet that has an active subscription." />
));
