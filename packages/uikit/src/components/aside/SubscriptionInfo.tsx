import { ProState } from '@tonkeeper/core/dist/entries/pro';
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

    const {
        subscription: { is_trial, valid, next_charge }
    } = data;

    const Expires = next_charge ? (
        <>
            {` ${t('it_expires_on')} `}
            {formatDate(next_charge, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                inputUnit: 'seconds'
            })}
        </>
    ) : null;

    if (is_trial) {
        return (
            <>
                {t('pro_trial_is_active')}
                {Expires}
            </>
        );
    }

    if (valid) {
        return (
            <>
                {t('pro_subscription_is_active')}
                {Expires}
            </>
        );
    }
    return null;
};

export const SubscriptionInfo: FC<{ className?: string }> = ({ className }) => {
    const { data } = useProState();

    if (!data) {
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
