import { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { packAssetId } from '@tonkeeper/core/dist/entries/crypto/asset/basic-asset';
import { TON_ASSET, TON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { getBatteryLevel } from '@tonkeeper/core/dist/utils/battery';

import { useAnalyticsTrack } from '../../../../hooks/analytics';
import { cn } from '../../../../libs/css';
import { useTranslation } from '../../../../hooks/translation';
import { useToast, useToastMutationError } from '../../../../hooks/useNotification';
import { Modal } from '../../../../primitives/Modal';
import { SkeletonScope, useSkeletonMask } from '../../../../primitives/Skeleton';
import {
    BatteryBalance,
    BatteryPromoCodeError,
    useBatteryOnChainRechargeMethods,
    useBatteryBalance,
    useCanBuyBattery,
    useProvideBatteryAuth,
    useRedeemBatteryPromoCode
} from '../../../../state/battery';
import { useJettonList } from '../../../../state/jetton';
import IllustrationGift44 from '../../../../icons/components/IllustrationGift44';
import IcClock28 from '../../../../icons/components/IcClock28';
import { SettingsListCell, SettingsListGroup } from '../settings/SettingsList';
import { TokenImage } from '../TokenImage';
import { BatteryLevelIcon } from './BatteryLevelIcon';
import { BatteryPromoCodeField, BatteryPromoCodeFieldProps } from './BatteryPromoCodeField';
import { BatterySettingsSheet, BatterySupportedTransactionsSheet } from './BatterySettingsSheet';
import { BatteryHistorySheet } from './BatteryHistorySheet';
import { BatteryRechargeFlow } from './BatteryRechargeFlow';
import { formatCount } from '@tonkeeper/core/dist/utils/numberFormat';

/** Surface the battery screen was opened from, reported to analytics. */
export type BatteryOpenedFrom = 'wallet' | 'settings';

export interface BatteryRechargeMethodRow {
    key: string;
    symbol: string;
    image?: string;
    assetId: string;
}

export interface BatteryModalViewProps {
    isOpen: boolean;
    onClose: () => void;
    afterClose?: () => void;
    /** `null`/`undefined` renders the loading state. */
    balance: BatteryBalance | null | undefined;
    /** Promo-code entry; absent when purchases are disabled for this wallet. */
    promo?: BatteryPromoCodeFieldProps;
    onOpenSettings: () => void;
    onOpenSupportedTransactions: () => void;
    methods: BatteryRechargeMethodRow[];
    onSelectMethod: (assetId: string) => void;
    /** Absent hides the gift row. */
    onSelectGift?: () => void;
    /** Absent hides the charges-history row. */
    onOpenHistory?: () => void;
    /**
     * Stacked over another sheet (e.g. the send confirm's fee picker): sized
     * to its content instead of taking the full height, so the sheet below
     * stays visible behind it.
     */
    layered?: boolean;
    /** Nested sheets (settings, recharge) owned by the connected component. */
    children?: ReactNode;
}

/**
 * Presentational battery screen: level glyph and charge count, the
 * supported-transactions link (empty battery) or the settings row (charged
 * battery), promo-code entry, recharge methods, the charges-history row and the
 * fee disclaimer. Every value
 * is a prop so the screenshot suite can mount it without the relayer.
 */
export const BatteryModalView: FC<BatteryModalViewProps> = ({
    isOpen,
    onClose,
    afterClose,
    balance,
    promo,
    onOpenSettings,
    onOpenSupportedTransactions,
    methods,
    onSelectMethod,
    onSelectGift,
    onOpenHistory,
    layered,
    children
}) => {
    const { t } = useTranslation();
    const loading = !balance;
    const hasRecharge = methods.length > 0 || !!onSelectGift;
    const level = balance ? getBatteryLevel(balance.tonUnitsBalance.relativeAmount) : 'empty';
    const isEmpty = level === 'empty';
    // The skeleton bar anchors to the caption's left edge, so a loading caption
    // must be a single narrow line for the bar to sit centred under the title.
    const caption = loading
        ? ' '
        : isEmpty
        ? t('battery_refill_networks_caption')
        : t('battery_charges', { charges: formatCount(balance!.batteryUnitsBalance) });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            afterClose={afterClose}
            variant={layered ? 'alert' : 'content'}
            mobileHeight={layered ? 'auto' : 'full'}
        >
            <SkeletonScope loading={loading}>
                <BatteryHeader
                    level={level}
                    caption={caption}
                    onOpenSupportedTransactions={isEmpty ? onOpenSupportedTransactions : undefined}
                />
            </SkeletonScope>

            {!loading && !isEmpty && (
                <SettingsListGroup className="mb-4">
                    <SettingsListCell
                        title={t('battery_transactions_settings')}
                        subtitle={t('battery_refill_networks_caption')}
                        chevron
                        onClick={onOpenSettings}
                    />
                </SettingsListGroup>
            )}

            {promo && (
                <div className="mb-4">
                    <BatteryPromoCodeField {...promo} />
                </div>
            )}

            {hasRecharge && (
                <SettingsListGroup>
                    {methods.map(method => (
                        <SettingsListCell
                            key={method.key}
                            title={t('battery_other_ways_by_crypto_title', {
                                symbol: method.symbol
                            })}
                            leftImage={
                                <TokenImage
                                    src={method.image}
                                    className="size-11 rounded-full bg-backgroundContentTint"
                                />
                            }
                            chevron
                            onClick={() => onSelectMethod(method.assetId)}
                        />
                    ))}
                    {onSelectGift && (
                        <SettingsListCell
                            title={t('battery_other_ways_gift_title')}
                            subtitle={t('battery_other_ways_gift_subtitle')}
                            leftImage={
                                <div className="size-11 overflow-hidden rounded-[12px] bg-backgroundContentTint">
                                    <IllustrationGift44 className="size-11" />
                                </div>
                            }
                            chevron
                            onClick={onSelectGift}
                        />
                    )}
                </SettingsListGroup>
            )}

            {onOpenHistory && (
                <SettingsListGroup className={cn(hasRecharge && 'mt-4')}>
                    <SettingsListCell
                        title={t('battery_history_title')}
                        subtitle={t('battery_history_subtitle')}
                        leftImage={
                            <div className="flex size-11 items-center justify-center rounded-[12px] bg-backgroundContentTint text-iconSecondary">
                                <IcClock28 className="size-7" />
                            </div>
                        }
                        chevron
                        onClick={onOpenHistory}
                    />
                </SettingsListGroup>
            )}

            <p className="px-4 pb-[18px] pt-4 text-center text-body2 text-textTertiary">
                {t('battery_packages_disclaimer')}
            </p>
            {children}
        </Modal>
    );
};

const BatteryHeader: FC<{
    level: ReturnType<typeof getBatteryLevel>;
    caption: string;
    onOpenSupportedTransactions?: () => void;
}> = ({ level, caption, onOpenSupportedTransactions }) => {
    const { t } = useTranslation();
    const mask = useSkeletonMask();
    return (
        <div className="flex flex-col items-center pb-8">
            <div className="pb-4">
                <BatteryLevelIcon level={level} size={128} />
            </div>
            <div className="flex w-full flex-col items-center gap-1 px-4 text-center">
                <h2 className="text-h2 text-textPrimary">{t('battery_title')}</h2>
                <p {...mask({ w: 107, h: 12 })} className="text-body1 text-textSecondary">
                    {caption}
                </p>
                {level === 'negative' && (
                    <p className="text-body1 text-accentRed">
                        {t('battery_refill_negative_balance_caption')}
                    </p>
                )}
                {onOpenSupportedTransactions && (
                    <button
                        type="button"
                        className="text-body1 text-accentBlue transition-opacity hover:opacity-80"
                        onClick={onOpenSupportedTransactions}
                    >
                        {t('battery_supported_transactions')}
                    </button>
                )}
            </div>
        </div>
    );
};

const BatteryModalConnected: FC<{
    isOpen: boolean;
    onClose: () => void;
    afterClose: () => void;
    from: BatteryOpenedFrom;
    layered?: boolean;
}> = ({ isOpen, onClose, afterClose, from, layered }) => {
    useProvideBatteryAuth();
    const { t } = useTranslation();
    const toast = useToast();
    const toastError = useToastMutationError();
    const track = useAnalyticsTrack();
    const { data: balance } = useBatteryBalance();
    const canBuyBattery = useCanBuyBattery();
    const { data: methods } = useBatteryOnChainRechargeMethods();
    const { data: jettons } = useJettonList();
    const redeemPromo = useRedeemBatteryPromoCode();

    const [promoCode, setPromoCode] = useState('');
    const [promoError, setPromoError] = useState<string | undefined>();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [supportedTransactionsOpen, setSupportedTransactionsOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [recharge, setRecharge] = useState<{ assetId: string; asGift: boolean } | undefined>();

    useEffect(() => {
        track({ eventName: 'battery_open', from });
    }, [track, from]);

    // Mirrors the native apps: rechargeable jettons the wallet holds, ordered by fiat value
    // (the jetton list's order), with USD₮ first even when the wallet never held it and the
    // chain coin last.
    const rows = useMemo<BatteryRechargeMethodRow[]>(() => {
        if (!methods || !jettons) return [];
        const usdtMaster = TON_USDT_ASSET.address.toRawString();
        const jettonOrder = new Map(jettons.balances.map((b, index) => [b.jetton.address, index]));
        const rank = (m: (typeof methods)[number]) => {
            if (m.jettonMaster === usdtMaster) return -1;
            if (m.type === 'ton') return Number.MAX_SAFE_INTEGER;
            return jettonOrder.get(m.jettonMaster!) ?? Number.MAX_SAFE_INTEGER;
        };
        return methods
            .filter(
                m =>
                    m.supportRecharge &&
                    (m.type === 'ton' ||
                        m.jettonMaster === usdtMaster ||
                        jettonOrder.has(m.jettonMaster!))
            )
            .sort((a, b) => rank(a) - rank(b))
            .map(method =>
                method.type === 'ton'
                    ? {
                          key: 'ton',
                          symbol: method.symbol,
                          image: TON_ASSET.image,
                          assetId: TON_ASSET.id
                      }
                    : {
                          key: method.jettonMaster!,
                          symbol: method.symbol,
                          image: method.image,
                          assetId: packAssetId(BLOCKCHAIN_NAME.TON, method.jettonMaster!)
                      }
            );
    }, [methods, jettons]);

    const onSubmitPromo = () => {
        setPromoError(undefined);
        redeemPromo.mutate(promoCode, {
            onSuccess: () => {
                setPromoCode('');
                toast(t('battery_promocode_success'));
            },
            onError: error => {
                if (error instanceof BatteryPromoCodeError) {
                    setPromoError(t('battery_promocode_invalid'));
                } else {
                    toastError(error);
                }
            }
        });
    };

    const closeAll = () => {
        setRecharge(undefined);
        onClose();
    };

    return (
        <BatteryModalView
            isOpen={isOpen}
            onClose={onClose}
            afterClose={afterClose}
            balance={balance}
            promo={
                canBuyBattery
                    ? {
                          value: promoCode,
                          onChange: value => {
                              setPromoCode(value);
                              setPromoError(undefined);
                          },
                          onSubmit: onSubmitPromo,
                          loading: redeemPromo.isLoading,
                          error: promoError
                      }
                    : undefined
            }
            layered={layered}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenSupportedTransactions={() => setSupportedTransactionsOpen(true)}
            methods={canBuyBattery ? rows : []}
            onSelectMethod={assetId => setRecharge({ assetId, asGift: false })}
            onSelectGift={
                canBuyBattery
                    ? () => setRecharge({ assetId: TON_ASSET.id, asGift: true })
                    : undefined
            }
            onOpenHistory={() => setHistoryOpen(true)}
        >
            <BatterySettingsSheet isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
            <BatterySupportedTransactionsSheet
                isOpen={supportedTransactionsOpen}
                onClose={() => setSupportedTransactionsOpen(false)}
            />
            <BatteryHistorySheet isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
            {recharge && (
                <BatteryRechargeFlow
                    isOpen
                    onClose={closeAll}
                    onBack={() => setRecharge(undefined)}
                    assetId={recharge.assetId}
                    asGift={recharge.asGift}
                    from={from}
                    onDone={() => {
                        closeAll();
                        toast(t('battery_please_wait'));
                    }}
                />
            )}
        </BatteryModalView>
    );
};

/**
 * Keeper Battery screen for multichain wallets. Opening it signs the
 * relayer proof for the account's TON wallet on first use (a passcode prompt),
 * so the data hooks mount only while the sheet is up and unmount once the
 * close animation ends.
 */
export const BatteryModal: FC<{
    isOpen: boolean;
    onClose: () => void;
    afterClose?: () => void;
    from: BatteryOpenedFrom;
    layered?: boolean;
}> = ({ isOpen, onClose, afterClose, from, layered }) => {
    const [mounted, setMounted] = useState(isOpen);

    useEffect(() => {
        if (isOpen) setMounted(true);
    }, [isOpen]);

    if (!mounted) {
        return null;
    }

    return (
        <BatteryModalConnected
            isOpen={isOpen}
            onClose={onClose}
            afterClose={() => {
                setMounted(false);
                afterClose?.();
            }}
            from={from}
            layered={layered}
        />
    );
};
