import {
    WalletVersion as WalletVersionEnum,
    WalletVersions,
    walletVersionText
} from '@tonkeeper/core/dist/entries/wallet';
import { getWalletAddress } from '@tonkeeper/core/dist/service/walletService';
import { toShortValue } from '@tonkeeper/core/dist/utils/common';
import { useMemo } from 'react';
import { InnerBody } from '../../components/Body';
import { CheckIcon } from '../../components/Icon';
import { SubHeader } from '../../components/SubHeader';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useMutateWalletVersion } from '../../state/account';
import { useEnableW5 } from '../../state/experemental';

export const WalletVersion = () => {
    const { t } = useTranslation();
    const { experimental } = useAppContext();
    const { data: enableW5 } = useEnableW5();
    const wallet = useWalletContext();

    const { mutate, isLoading } = useMutateWalletVersion();

    const items = useMemo<SettingsItem[]>(() => {
        const publicKey = Buffer.from(wallet.publicKey, 'hex');
        let list = [...WalletVersions];

        if (experimental && enableW5) {
            list.push(WalletVersionEnum.W5);
        }

        return list.map(item => ({
            name: walletVersionText(item),
            secondary: toShortValue(
                getWalletAddress(publicKey, item, wallet.network).friendlyAddress
            ),
            icon: wallet.active.version === item ? <CheckIcon /> : undefined,
            action: () => mutate(item)
        }));
    }, [wallet, mutate, experimental, enableW5]);

    return (
        <>
            <SubHeader title={t('settings_wallet_version')} />
            <InnerBody>
                <SettingsList items={items} loading={isLoading} />
            </InnerBody>
        </>
    );
};
