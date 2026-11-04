import { FC } from 'react';

import { Switch } from '../../../../primitives';
import IcKey28 from '../../../../icons/components/IcKey28';
import IcStar28 from '../../../../icons/components/IcStar28';
import { SettingsListCell, SettingsListGroup } from './SettingsList';

/**
 * CT mount wrapper: Playwright's static mount-loader can't resolve
 * component wrappers defined inside the test file itself.
 */
export const SettingsListGroupHarness: FC = () => (
    <div className="w-[390px] p-4">
        <SettingsListGroup>
            <SettingsListCell
                title="Wallet"
                subtitle="Customize"
                leftImage={
                    <div className="flex size-11 items-center justify-center rounded-full bg-backgroundContentTint">
                        <span className="text-2xl leading-none">🙂</span>
                    </div>
                }
                chevron
                onClick={() => {}}
            />
            <SettingsListCell title="Backup" dot="red" rightIcon={<IcKey28 />} onClick={() => {}} />
            <SettingsListCell
                title="Rate"
                rightIcon={<IcStar28 />}
                rightIconTint="secondary"
                onClick={() => {}}
            />
            <SettingsListCell title="Currency" rightText="USD" onClick={() => {}} />
            <SettingsListCell title="Lock screen" rightNode={<Switch checked />} />
        </SettingsListGroup>
    </div>
);
