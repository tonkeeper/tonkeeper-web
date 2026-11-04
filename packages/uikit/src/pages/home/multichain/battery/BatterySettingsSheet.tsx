import { FC, ReactNode } from 'react';
import { TonWalletConfig } from '@tonkeeper/core/dist/entries/wallet';

import { useTranslation } from '../../../../hooks/translation';
import { Modal } from '../../../../primitives/Modal';
import { Switch } from '../../../../primitives/Switch';
import { useBatteryServiceConfigNonSuspense } from '../../../../state/battery';
import { useActiveTonWalletConfig, useMutateActiveTonWalletConfig } from '../../../../state/wallet';
import { SettingsListCell, SettingsListGroup } from '../settings/SettingsList';
import { formatCount } from '@tonkeeper/core/dist/utils/numberFormat';

export type BatterySettingToggleKey = 'enabledForSwaps' | 'enabledForNfts' | 'enabledForTokens';

/** Mean charge cost per operation from the relayer config; a missing price hides the row. */
export interface BatteryTransactionPrices {
    swap?: number;
    token?: number;
    nft?: number;
    tronUsdt?: number;
}

const useBatteryTransactionPrices = (): BatteryTransactionPrices => {
    const { data: serviceConfig } = useBatteryServiceConfigNonSuspense();
    return {
        swap: serviceConfig?.meanPrices.batteryMeanPriceSwap,
        token: serviceConfig?.meanPrices.batteryMeanPriceJetton,
        nft: serviceConfig?.meanPrices.batteryMeanPriceNft,
        tronUsdt: serviceConfig?.meanPrices.batteryMeanPriceTronUsdt
    };
};

/**
 * Transaction kinds the battery pays for, in the native apps' order. Swap and
 * token-transfer costs vary by network, so their captions quote the TON
 * figure (swap) or the floor (token) rather than one exact price.
 */
const BatteryTransactionsList: FC<{
    prices: BatteryTransactionPrices;
    renderToggle?: (key: BatterySettingToggleKey | 'tronUsdt') => ReactNode;
}> = ({ prices, renderToggle }) => {
    const { t } = useTranslation();

    return (
        <SettingsListGroup>
            {!!prices.swap && (
                <SettingsListCell
                    title={t('battery_settings_swap_title')}
                    subtitle={t('battery_settings_swap_price_networks', {
                        charges: formatCount(prices.swap)
                    })}
                    rightNode={renderToggle?.('enabledForSwaps')}
                />
            )}
            {!!prices.token && (
                <SettingsListCell
                    title={t('battery_settings_token_transfer_title')}
                    subtitle={t('battery_settings_token_transfer_price_networks')}
                    rightNode={renderToggle?.('enabledForTokens')}
                />
            )}
            {!!prices.nft && (
                <SettingsListCell
                    title={t('battery_settings_nft_title')}
                    subtitle={t('battery_settings_nft_price', {
                        charges: formatCount(prices.nft)
                    })}
                    rightNode={renderToggle?.('enabledForNfts')}
                />
            )}
            {!!prices.tronUsdt && (
                <SettingsListCell
                    title={t('battery_transactions_type_usdt_trc20_transfer')}
                    subtitle={t('battery_settings_token_transfer_price', {
                        charges: formatCount(prices.tronUsdt)
                    })}
                    rightNode={renderToggle?.('tronUsdt')}
                />
            )}
        </SettingsListGroup>
    );
};

export interface BatterySettingsSheetViewProps {
    isOpen: boolean;
    onClose: () => void;
    values: TonWalletConfig['batterySettings'];
    prices: BatteryTransactionPrices;
    saving?: boolean;
    onToggle: (key: BatterySettingToggleKey) => void;
}

/**
 * Which transaction kinds the battery pays for. USDT TRC-20 transfers are
 * always covered — the row is shown locked on, matching the native apps.
 */
export const BatterySettingsSheetView: FC<BatterySettingsSheetViewProps> = ({
    isOpen,
    onClose,
    values,
    prices,
    saving,
    onToggle
}) => {
    const { t } = useTranslation();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            heading={t('battery_transactions_settings')}
            subheading={t('battery_transactions_description')}
        >
            <BatteryTransactionsList
                prices={prices}
                renderToggle={key =>
                    key === 'tronUsdt' ? (
                        <Switch checked disabled />
                    ) : (
                        <Switch
                            checked={values[key]}
                            disabled={saving}
                            onChange={() => onToggle(key)}
                        />
                    )
                }
            />
        </Modal>
    );
};

export const BatterySettingsSheet: FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    const { data: walletConfig } = useActiveTonWalletConfig();
    const prices = useBatteryTransactionPrices();
    const { mutate, isLoading } = useMutateActiveTonWalletConfig();

    if (!walletConfig) {
        return null;
    }

    return (
        <BatterySettingsSheetView
            isOpen={isOpen}
            onClose={onClose}
            values={walletConfig.batterySettings}
            prices={prices}
            saving={isLoading}
            onToggle={key =>
                mutate({
                    batterySettings: {
                        ...walletConfig.batterySettings,
                        [key]: !walletConfig.batterySettings[key]
                    }
                })
            }
        />
    );
};

export const BatterySupportedTransactionsSheetView: FC<{
    isOpen: boolean;
    onClose: () => void;
    prices: BatteryTransactionPrices;
}> = ({ isOpen, onClose, prices }) => {
    const { t } = useTranslation();

    return (
        <Modal isOpen={isOpen} onClose={onClose} heading={t('battery_transactions_title')}>
            <BatteryTransactionsList prices={prices} />
        </Modal>
    );
};

export const BatterySupportedTransactionsSheet: FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    const prices = useBatteryTransactionPrices();

    return (
        <BatterySupportedTransactionsSheetView isOpen={isOpen} onClose={onClose} prices={prices} />
    );
};
