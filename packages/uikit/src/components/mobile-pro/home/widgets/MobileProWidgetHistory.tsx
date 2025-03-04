import React, { FC } from 'react';
import styled from 'styled-components';
import { WidgetHeader } from './common';
import { AppRoute } from '../../../../libs/routes';
import { useTranslation } from '../../../../hooks/translation';
import { Skeleton } from '../../../shared/Skeleton';
import { ActivityItem } from '../../../../state/activity';
import { DesktopHistory } from '../../../desktop/history/DesktopHistory';

const Wrapper = styled.div`
    padding: 0.5rem 0 1rem;

    border-bottom: 1px solid ${p => p.theme.separatorCommon};

    .event-groups-divider {
        display: none;
    }
`;

const SkeletonsWrapper = styled.div`
    padding: 8px 16px 0;
`;

export const MobileProWidgetHistory: FC<{ className?: string; activity?: ActivityItem[] }> = ({
    className,
    activity
}) => {
    const { t } = useTranslation();

    return (
        <Wrapper className={className}>
            <WidgetHeader to={AppRoute.activity}>{t('wallet_aside_history')}</WidgetHeader>
            {activity ? (
                <DesktopHistory activity={activity} isFetchingNextPage={false} />
            ) : (
                <SkeletonsWrapper>
                    <Skeleton width="100px" height="20px" marginBottom="6px" />
                    <Skeleton width="300px" height="16px" marginBottom="6px" />
                    <Skeleton width="200px" height="16px" marginBottom="6px" />
                </SkeletonsWrapper>
            )}
        </Wrapper>
    );
};
