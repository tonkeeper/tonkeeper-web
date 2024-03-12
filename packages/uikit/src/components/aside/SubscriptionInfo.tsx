import {
    isTrialSubscription,
    isValidSubscription,
    ProState
} from '@tonkeeper/core/dist/entries/pro';
import { FC } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { useDateTimeFormat } from '../../hooks/useDateTimeFormat';
import { AppRoute, SettingsRoute } from '../../libs/routes';
import { useProState } from '../../state/pro';
import { Body3 } from '../Text';

const LinkStyled = styled(Link)`
    text-decoration: none;
`;

const InfoStyled = styled(Body3)`
    display: block;
    padding: 6px 16px;
    color: ${p => p.theme.textSecondary};
`;

export const SubscriptionStatus: FC<{ data: ProState }> = ({ data }) => {
    const { t } = useTranslation();
    const formatDate = useDateTimeFormat();

    const { subscription } = data;

    if (isTrialSubscription(subscription)) {
        return (
            <>
                <div>{t('aside_pro_trial_is_active')}</div>
                <div>
                    {t('aside_expires_on').replace(
                        '%date%',
                        formatDate(subscription.trialEndDate, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            inputUnit: 'seconds'
                        })
                    )}
                </div>
            </>
        );
    }

    if (isValidSubscription(subscription)) {
        return (
            <>
                <div>{t('aside_pro_subscription_is_active')}</div>
                <div>
                    {t('aside_expires_on').replace(
                        '%date%',
                        formatDate(subscription.nextChargeDate, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            inputUnit: 'seconds'
                        })
                    )}
                </div>
            </>
        );
    }
    return null;
};

export const SubscriptionInfo: FC<{ className?: string }> = ({ className }) => {
    const { data } = useProState();

    if (!data || !data.subscription.valid) {
        return null;
    }

    return (
        <LinkStyled to={AppRoute.settings + SettingsRoute.pro}>
            <InfoStyled className={className}>
                <SubscriptionStatus data={data} />
            </InfoStyled>
        </LinkStyled>
    );
};
