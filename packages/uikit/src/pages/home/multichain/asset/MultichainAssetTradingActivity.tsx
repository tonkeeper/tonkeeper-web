import { FC, useMemo } from 'react';
import { useTranslation } from '../../../../hooks/translation';
import BigNumber from 'bignumber.js';

import { AssetDetailsTradingActivity } from '@tonkeeper/core/dist/service/tradingService';

import { useAppContext } from '../../../../hooks/appContext';
import { ExternalLink } from '../../../../components/shared/ExternalLink';
import { formatCompact } from '@tonkeeper/core/dist/utils/numberFormat';
import { diffColorClass, formatPercentChange } from '../multichain-utils';
import { ListTitle } from '../ListTitle';
import { MultichainHint } from '../MultichainHint';

const DATA_PROVIDER_NAME = 'dyor.io';
const DATA_PROVIDER_URL = 'https://dyor.io/';

function buyShare(buy: string | undefined, sell: string | undefined): number {
    if (!buy || !sell) return 0.5;
    const b = new BigNumber(buy);
    const s = new BigNumber(sell);
    const total = b.plus(s);
    if (total.isZero()) return 0.5;
    return b.dividedBy(total).toNumber();
}

export const MultichainAssetTradingActivity: FC<{
    activity: AssetDetailsTradingActivity;
}> = ({ activity }) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const providerNote = t('wallet_asset_data_provider_note');
    const providerNameIndex = providerNote.indexOf(DATA_PROVIDER_NAME);
    const share = useMemo(
        () => buyShare(activity.buy24h, activity.sell24h),
        [activity.buy24h, activity.sell24h]
    );

    if (!activity.enabled) return null;
    if (!activity.volume24h && !activity.buy24h && !activity.sell24h) return null;

    return (
        <section className="flex flex-col px-4 pb-2">
            <ListTitle title={t('wallet_asset_trading_activity_24h')} />
            {/* No overflow-hidden: the volume hint bubble extends above the card. */}
            <div className="flex flex-col rounded-medium bg-backgroundContent">
                {activity.volume24h && (
                    <div className="flex items-center justify-between px-4 pb-2 pt-4">
                        <div className="flex items-center gap-1 text-body1 text-textSecondary">
                            <span>{t('wallet_asset_volume')}</span>
                            <MultichainHint
                                label={t('wallet_asset_volume')}
                                text={t('wallet_asset_volume_hint')}
                            />
                        </div>
                        <div className="text-label1 text-textPrimary">
                            {formatCompact(activity.volume24h, { currency: fiat })}
                            {activity.volumeChange24h && (
                                <span
                                    className={
                                        ' ml-2 text-body2 ' +
                                        diffColorClass(activity.volumeChange24h)
                                    }
                                >
                                    {formatPercentChange(activity.volumeChange24h)}
                                </span>
                            )}
                        </div>
                    </div>
                )}
                {(activity.buy24h || activity.sell24h) && (
                    <div className="mx-4 my-2 flex h-1.5 items-center gap-1 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-accentGreen"
                            style={{ width: `${share * 100}%` }}
                        />
                        <div
                            className="h-full flex-1 rounded-full bg-accentRed"
                            style={{ width: `${(1 - share) * 100}%` }}
                        />
                    </div>
                )}
                {(activity.buy24h || activity.sell24h) && (
                    <div className="flex items-center justify-between px-4 pb-4 pt-2 text-body2">
                        {activity.buy24h && (
                            <span className="text-accentGreen">
                                {t('wallet_buy')} ·{' '}
                                {formatCompact(activity.buy24h, { currency: fiat })}
                            </span>
                        )}
                        {activity.sell24h && (
                            <span className="text-accentRed">
                                {t('wallet_sell')} ·{' '}
                                {formatCompact(activity.sell24h, { currency: fiat })}
                            </span>
                        )}
                    </div>
                )}
            </div>
            <div className="px-4 pb-2 pt-3 text-body3 text-textTertiary">
                {providerNameIndex === -1 ? (
                    providerNote
                ) : (
                    <>
                        {providerNote.slice(0, providerNameIndex)}
                        <ExternalLink colored href={DATA_PROVIDER_URL}>
                            {DATA_PROVIDER_NAME}
                        </ExternalLink>
                        {providerNote.slice(providerNameIndex + DATA_PROVIDER_NAME.length)}
                    </>
                )}
            </div>
        </section>
    );
};
