import { FC } from 'react';
import styled from 'styled-components';
import { Body2, Label2 } from '../Text';
import { Button } from '../fields/Button';
import { useActivateTrialMutation, useProState } from '../../state/pro';
import { useDateTimeFormat } from '../../hooks/useDateTimeFormat';
import { ProNotification } from './ProNotification';
import { useDisclosure } from '../../hooks/useDisclosure';
import { useTranslation } from '../../hooks/translation';
import { isPaidSubscription, isTrialSubscription } from '@tonkeeper/core/dist/entries/pro';

const ProBannerStyled = styled.div`
    background: ${p => p.theme.backgroundContent};
    border-radius: ${p => p.theme.cornerSmall};
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    padding: 1rem 14px;
    gap: 1rem;
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

export const ProBanner: FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    const formatDate = useDateTimeFormat();
    const { mutate } = useActivateTrialMutation();
    const { data } = useProState();
    const { isOpen, onOpen, onClose } = useDisclosure();

    if (!data) {
        return null;
    }

    const { subscription } = data;

    if (isPaidSubscription(subscription)) {
        return null;
    }

    return (
        <ProBannerStyled className={className}>
            <TextContainerStyled>
                <Label2>{t('pro_banner_title')}</Label2>
                <Body2>{t('pro_banner_subtitle')}</Body2>
            </TextContainerStyled>
            <ButtonsContainerStyled>
                {isTrialSubscription(subscription) ? (
                    <Label2Styled>
                        {t('pro_banner_days_left').replace(
                            '%days%',
                            formatDate(subscription.trialEndDate, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })
                        )}
                    </Label2Styled>
                ) : (
                    !subscription.usedTrial && (
                        <Button size="small" corner="2xSmall" onClick={() => mutate()}>
                            {t('pro_banner_start_trial')}
                        </Button>
                    )
                )}

                <Button size="small" corner="2xSmall" primary onClick={onOpen}>
                    {t('pro_banner_buy')}
                </Button>
            </ButtonsContainerStyled>
            <ProNotification isOpen={isOpen} onClose={onClose} />
        </ProBannerStyled>
    );
};
