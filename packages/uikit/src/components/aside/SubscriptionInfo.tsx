import { FC } from 'react';
import styled from 'styled-components';
import { Body3 } from '../Text';
import { useDateTimeFormat } from '../../hooks/useDateTimeFormat';
import { useProState } from '../../state/pro';
import { Link } from 'react-router-dom';
import { AppRoute, SettingsRoute } from '../../libs/routes';

const LinkStyled = styled(Link)`
    text-decoration: none;
`;

const InfoStyled = styled(Body3)`
    display: block;
    padding: 6px 16px;
    color: ${p => p.theme.textSecondary};
`;

export const SubscriptionInfo: FC<{ className?: string }> = ({ className }) => {
    const formatDate = useDateTimeFormat();
    const { data } = useProState();

    if (!data) {
        return null;
    }

    const {
        subscription: { is_trial, valid, next_charge }
    } = data;

    const linkToSettings = AppRoute.settings + SettingsRoute.pro;

    if (is_trial) {
        return (
            <LinkStyled to={linkToSettings}>
                <InfoStyled className={className}>
                    Pro Trial is active.
                    {next_charge && (
                        <>
                             It expires on{' '}
                            {formatDate(next_charge, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                inputUnit: 'seconds'
                            })}
                        </>
                    )}
                </InfoStyled>
            </LinkStyled>
        );
    }

    if (valid) {
        return (
            <LinkStyled to={linkToSettings}>
                <InfoStyled className={className}>
                    Pro Subscription is active.
                    {next_charge && (
                        <>
                            It expires on{' '}
                            {formatDate(next_charge, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                inputUnit: 'seconds'
                            })}
                        </>
                    )}
                </InfoStyled>
            </LinkStyled>
        );
    }

    return null;
};
