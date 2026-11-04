import { FC, useMemo } from 'react';

import { formatAddress } from '@tonkeeper/core/dist/utils/common';

import { Loader } from '../../../../primitives';
import { cn } from '../../../../libs/css';
import { useAppSdk } from '../../../../hooks/appSdk';
import { useNavigateBack } from '../../../../hooks/router/useNavigateBack';
import { useTranslation } from '../../../../hooks/translation';
import { MultichainRoute } from '../../../../libs/routes';
import {
    useHideNft,
    useMakeNftVisible,
    useMarkNftAsTrusted,
    useWalletNftList
} from '../../../../state/nft';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../../../../state/tonendpoint';
import {
    useActiveConfig,
    useActiveTonNetwork,
    useActiveTonWalletConfig,
    useActiveWallet
} from '../../../../state/wallet';
import { Navigate } from '../../../../components/shared/Navigate';
import { BackButton } from '../../../../primitives/BackButton';
import { groupCollectiblesForSettings } from './collectibles-settings-utils';
import { MultichainCollectiblesSettingsView } from './MultichainCollectiblesSettingsView';

export const MultichainCollectiblesSettingsPage: FC<{ compact?: boolean }> = ({
    compact = false
}) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const navigateBack = useNavigateBack(MultichainRoute.collectibles);
    const network = useActiveTonNetwork();
    const wallet = useActiveWallet();
    const tonConfig = useActiveConfig();
    const { data: nfts } = useWalletNftList();
    const { data: config } = useActiveTonWalletConfig();
    const { mutate: hideNft } = useHideNft();
    const { mutate: makeNftVisible } = useMakeNftVisible();
    const { mutate: markNftAsTrusted } = useMarkNftAsTrusted();

    const sections = useMemo(
        () => (nfts && config ? groupCollectiblesForSettings(nfts, config) : undefined),
        [nfts, config]
    );

    const isNftEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.NFT);
    if (!isNftEnabled) {
        return <Navigate to={MultichainRoute.home} />;
    }

    if (!sections) {
        return (
            <div
                className={cn(
                    'flex flex-col bg-backgroundPage',
                    compact ? 'min-h-full' : 'min-h-screen'
                )}
            >
                <header className="relative flex h-16 shrink-0 items-center justify-center px-16">
                    <BackButton
                        onClick={navigateBack}
                        className="absolute left-2 top-1/2 -translate-y-1/2"
                    />
                    <div className="text-h3 text-textPrimary">
                        {t('settings_collectibles_list')}
                    </div>
                </header>
                <div className="flex flex-1 items-center justify-center py-16">
                    <Loader />
                </div>
            </div>
        );
    }

    return (
        <MultichainCollectiblesSettingsView
            compact={compact}
            network={network}
            visible={sections.visible}
            hidden={sections.hidden}
            spam={sections.spam}
            blacklistedCount={sections.blacklistedCount}
            onBack={navigateBack}
            onHide={group =>
                hideNft(
                    group.isSingle
                        ? { address: group.address }
                        : { address: group.address, collection: { address: group.address } }
                )
            }
            onShow={group => makeNftVisible(group.address)}
            onNotSpam={group => markNftAsTrusted(group.address)}
            onOpenAllSpam={() =>
                sdk.openPage(
                    `${tonConfig.accountExplorer.replace(
                        '%s',
                        formatAddress(wallet.rawAddress, network, true)
                    )}?section=nfts`
                )
            }
        />
    );
};
