import { FC, useState } from 'react';

import { useActiveAccount } from '../../../state/wallet';
import { useNavigate } from '../../../hooks/router/useNavigate';
import { useTranslation } from '../../../hooks/translation';
import { MultichainRoute } from '../../../libs/routes';
import IcClockOutline28 from '../../../icons/components/IcClockOutline28';
import IcGearOutline28 from '../../../icons/components/IcGearOutline28';
import IcChevronDown16 from '../../../icons/components/IcChevronDown16';
import { WalletEmoji } from '../../../components/shared/emoji/WalletEmoji';
import { Button } from '../../../primitives';
import { HomeHeaderIconButton } from './HomeHeaderIconButton';
import { MultichainScanButton } from './MultichainScanButton';
import { WalletSwitcherSheet } from './wallets/WalletSwitcherSheet';

export const HomeMultichainHeaderBar: FC = () => {
    const { t } = useTranslation();
    const account = useActiveAccount();
    const navigate = useNavigate();
    const [switcherOpen, setSwitcherOpen] = useState(false);

    return (
        <div className="sticky top-0 z-20 h-16 shrink-0 bg-backgroundPage text-iconSecondary">
            <MultichainScanButton />
            {/* The pill centers on the header rather than on the space between
                the icon groups, so it is positioned instead of laid out. It
                needs its own wrapper: `Button`'s base class list carries
                `relative`, which wins over an `absolute` passed by a caller. */}
            <div className="absolute left-1/2 top-1/2 flex max-w-[calc(100%-208px)] -translate-x-1/2 -translate-y-1/2">
                <Button
                    variant="tertiary"
                    size="small"
                    className="h-10 min-w-0 max-w-full gap-1.5 pl-[18px] pr-3"
                    onClick={() => setSwitcherOpen(true)}
                >
                    <WalletEmoji emoji={account.emoji} emojiSize="18px" containerSize="18px" />
                    <span className="min-w-0 truncate">{account.name}</span>
                    <IcChevronDown16 className="h-4 w-4 shrink-0 text-iconSecondary opacity-[0.64]" />
                </Button>
            </div>
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">
                <HomeHeaderIconButton
                    label={t('page_header_history')}
                    icon={<IcClockOutline28 />}
                    onClick={() => navigate(MultichainRoute.history)}
                />
                <HomeHeaderIconButton
                    label={t('wallet_aside_settings')}
                    icon={<IcGearOutline28 />}
                    onClick={() => navigate(MultichainRoute.settings)}
                />
            </div>
            <WalletSwitcherSheet isOpen={switcherOpen} onClose={() => setSwitcherOpen(false)} />
        </div>
    );
};
