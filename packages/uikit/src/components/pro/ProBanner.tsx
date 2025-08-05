import { FC } from 'react';
import styled, { css } from 'styled-components';
import { Body2, Label2 } from '../Text';
import { Button } from '../fields/Button';
import { useProState } from '../../state/pro';
import { useDateTimeFormat } from '../../hooks/useDateTimeFormat';
import { useTranslation } from '../../hooks/translation';
import {
    isPaidActiveSubscription,
    isTelegramActiveSubscription
} from '@tonkeeper/core/dist/entries/pro';
import { ForTargetEnv, NotForTargetEnv } from '../shared/TargetEnv';
import { ChevronRightIcon } from '../Icon';
import { useAppTargetEnv } from '../../hooks/appSdk';
import { useProFeaturesNotification } from '../modals/ProFeaturesNotificationControlled';

const ProBannerStyled = styled.div`
    background: ${p => p.theme.backgroundContent};
    border-radius: ${p => p.theme.cornerSmall};
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    padding: 1rem 14px;
    gap: 1rem;

    ${p =>
        p.theme.proDisplayType === 'mobile' &&
        css`
            flex-direction: row;
            flex-wrap: nowrap;

            > *:last-child {
                color: ${p.theme.iconSecondary};
                flex-shrink: 0;
            }
        `}
`;

const TextContainerStyled = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 300px;
`;
const ButtonsContainerStyled = styled.div`
    align-items: center;
    display: flex;
    gap: 8px;
`;

const Label2Styled = styled(Label2)`
    padding-right: 12px;
`;

const Body2Styled = styled(Body2)`
    color: ${p => p.theme.textSecondary};
`;

export const ProBanner: FC<{ className?: string }> = ({ className }) => {
    const { onOpen } = useProFeaturesNotification();
    const { t } = useTranslation();
    const formatDate = useDateTimeFormat();
    const { data: subscription } = useProState();
    const targetEnv = useAppTargetEnv();

    if (!subscription) {
        return null;
    }

    const nextChargeDate = isTelegramActiveSubscription(subscription)
        ? subscription.nextChargeDate
        : undefined;

    if (isPaidActiveSubscription(subscription)) {
        return null;
    }

    const onBannerClick = () => {
        if (targetEnv === 'mobile') {
            onOpen();
        }
    };

    return (
        <ProBannerStyled className={className} onClick={onBannerClick}>
            <TextContainerStyled>
                <Label2>{t('pro_banner_title')}</Label2>
                <Body2Styled>{t('pro_banner_subtitle')}</Body2Styled>
            </TextContainerStyled>
            <NotForTargetEnv env="mobile">
                <ButtonsContainerStyled>
                    {nextChargeDate && (
                        <Label2Styled>
                            {t('pro_banner_days_left').replace(
                                '%days%',
                                formatDate(nextChargeDate, {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                })
                            )}
                        </Label2Styled>
                    )}

                    <Button size="small" corner="2xSmall" primary onClick={() => onOpen()}>
                        {t('about_tonkeeper_pro')}
                    </Button>
                </ButtonsContainerStyled>
            </NotForTargetEnv>
            <ForTargetEnv env="mobile">
                <ChevronRightIcon />
            </ForTargetEnv>
        </ProBannerStyled>
    );
};
