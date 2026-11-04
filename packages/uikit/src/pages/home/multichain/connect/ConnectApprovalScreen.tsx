import { FC, ReactNode } from 'react';

import { AccountMultichain } from '@tonkeeper/core/dist/entries/account';
import { WalletConnectNetwork } from '@tonkeeper/core/dist/service/walletConnect/wcChains';
import { orderMultichainChains } from '@tonkeeper/core/dist/chains/multichain-chain-order';

import { useTranslation } from '../../../../hooks/translation';
import IcChevronRight16 from '../../../../icons/components/IcChevronRight16';
import IcLogo from '../../../../icons/components/IcLogo';
import IcDonemarkOutline28 from '../../../../icons/components/IcDonemarkOutline28';
import IcSwitch16 from '../../../../icons/components/IcSwitch16';
import { cn } from '../../../../libs/css';
import { WalletEmoji } from '../../../../components/shared/emoji/WalletEmoji';
import { Button, ModalFooter, ModalFooterPortal } from '../../../../primitives';
import { networkIcon } from '../multichain-utils';

export type ConnectRiskLevel = 'none' | 'unknown' | 'mismatch' | 'scam';

export const ConnectApprovalScreen: FC<{
    meta: { name: string; domain: string; icon?: string; risk: ConnectRiskLevel };
    account: AccountMultichain;
    accountCount: number;
    networks: (WalletConnectNetwork | 'ton')[];
    error?: string;
    unsupportedProposal: boolean;
    caption: string;
    isLoading: boolean;
    done: boolean;
    onSelectWallet: () => void;
    onSelectNetworks: () => void;
    onConnect: () => void;
}> = ({
    meta,
    account,
    accountCount,
    networks,
    error,
    unsupportedProposal,
    caption,
    isLoading,
    done,
    onSelectWallet,
    onSelectNetworks,
    onConnect
}) => {
    const { t } = useTranslation();
    const orderedNetworks = orderMultichainChains(networks);
    const walletAddress =
        account.getWalletByChain('evm')?.rawAddress ?? account.activeTonWallet.rawAddress;
    return (
        <>
            <ConnectHeader dappIcon={meta.icon} walletAddress={walletAddress} />
            <div className="flex flex-col items-center gap-1 pb-6 text-center">
                <h2 className="text-h2 text-textPrimary">
                    {t('ton_login_title_web', { name: meta.name })}
                </h2>
                <p className="text-body1 text-textSecondary">
                    <span className="text-textAccent">{meta.domain}</span>{' '}
                    {t('connect_requesting_access')}
                </p>
            </div>

            <button
                type="button"
                onClick={onSelectWallet}
                className={cn(
                    'flex w-full items-center gap-4 rounded-medium bg-backgroundContent p-4 text-left',
                    accountCount > 1 && 'transition-colors hover:bg-backgroundContentTint'
                )}
            >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-backgroundContentTint">
                    <WalletEmoji emoji={account.emoji} emojiSize="24px" containerSize="24px" />
                </span>
                <span className="flex-1 truncate text-label1 text-textPrimary">{account.name}</span>
                {accountCount > 1 && <IcSwitch16 className="size-4 shrink-0 text-textSecondary" />}
            </button>

            <SectionTitle>{t('connect_allow_app_title')}</SectionTitle>
            <div className="overflow-hidden rounded-medium bg-backgroundContent">
                <PermissionRow>{t('connect_permission_view_info')}</PermissionRow>
                <PermissionRow last>{t('connect_permission_request_approvals')}</PermissionRow>
            </div>

            <SectionTitle>{t('connect_networks')}</SectionTitle>
            <button
                type="button"
                onClick={onSelectNetworks}
                className="flex w-full items-center rounded-medium bg-backgroundContent px-4 py-4 transition-colors hover:bg-backgroundContentTint"
                disabled={orderedNetworks.length === 0}
            >
                <span className="flex flex-1 items-center">
                    {orderedNetworks.map(network => (
                        <span
                            key={network}
                            className="-mr-1 flex size-6 items-center justify-center overflow-hidden rounded-full bg-backgroundContentTint ring-2 ring-backgroundContent [&>svg]:size-6"
                        >
                            {networkIcon(network)}
                        </span>
                    ))}
                </span>
                <IcChevronRight16 className="size-4 shrink-0 text-textTertiary" />
            </button>

            {(error || unsupportedProposal) && (
                <p className="px-1 pt-3 text-center text-body2 text-accentRed">
                    {error ?? t('connect_unsupported_networks')}
                </p>
            )}

            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        variant={meta.risk === 'none' ? 'primaryBlue' : 'primaryRed'}
                        size="large"
                        fullWidth
                        loading={isLoading}
                        disabled={isLoading || done || unsupportedProposal}
                        onClick={onConnect}
                        className={cn(
                            meta.risk === 'unknown' &&
                                'bg-accentOrange hover:enabled:bg-accentOrange/80',
                            done && 'bg-accentGreen text-white'
                        )}
                    >
                        {done ? t('ton_login_success') : t('connect_wallet')}
                    </Button>
                    <p
                        className={cn(
                            'px-4 pt-1 text-center text-body2',
                            meta.risk === 'none'
                                ? 'text-textTertiary'
                                : meta.risk === 'unknown'
                                ? 'text-accentOrange'
                                : 'text-accentRed'
                        )}
                    >
                        {caption}
                    </p>
                </ModalFooter>
            </ModalFooterPortal>
        </>
    );
};

const ConnectHeader: FC<{ dappIcon?: string; walletAddress: string }> = ({
    dappIcon,
    walletAddress
}) => (
    <div className="flex items-center justify-center pb-5 pt-2">
        <span className="flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-backgroundContent">
            <IcLogo className="size-10 text-iconPrimary" />
        </span>
        <span className="relative h-[72px] w-[86px] shrink-0 overflow-hidden">
            <span className="absolute inset-y-0 left-0 flex w-[43px] items-center overflow-hidden">
                <span className="whitespace-nowrap text-body2 text-textTertiary">
                    {walletAddress.replace(/^0x/, '')}
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent to-backgroundPage" />
            </span>
            <span className="absolute inset-y-0 right-0 flex w-[43px] items-center justify-end overflow-hidden">
                <span className="whitespace-nowrap tracking-[3px] text-body3 text-textTertiary">
                    ****************
                </span>
                <span className="absolute inset-0 bg-gradient-to-l from-transparent to-backgroundPage" />
            </span>
            <span className="absolute left-1/2 top-1/2 h-8 w-px -translate-x-1/2 -translate-y-1/2 bg-separatorCommon" />
        </span>
        <span className="flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-backgroundContent">
            {dappIcon && <img src={dappIcon} alt="" className="size-full object-cover" />}
        </span>
    </div>
);

const SectionTitle: FC<{ children: ReactNode }> = ({ children }) => (
    <div className="flex items-center py-3">
        <span className="text-label1 text-textPrimary">{children}</span>
    </div>
);

const PermissionRow: FC<{ children: ReactNode; last?: boolean }> = ({ children, last }) => (
    <div className={cn('flex items-center gap-3 px-4 py-3.5', !last && 'pb-0')}>
        <IcDonemarkOutline28 className="size-7 shrink-0 text-textAccent" />
        <span className="text-body2 text-textPrimary">{children}</span>
    </div>
);
