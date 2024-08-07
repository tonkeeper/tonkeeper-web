import {
    isTrialSubscription,
    isValidSubscription,
    ProState
} from '@tonkeeper/core/dist/entries/pro';
import { FC, useState } from 'react';
import styled, { css } from 'styled-components';
import { useTranslation } from '../../../hooks/translation';
import { useDateTimeFormat } from '../../../hooks/useDateTimeFormat';
import { useProState } from '../../../state/pro';
import { Body3 } from '../../Text';
import { Button } from '../../fields/Button';
import { useProFeaturesNotification } from '../../modals/ProFeaturesNotificationControlled';
import { IconButtonTransparentBackground } from '../../fields/IconButton';
import { RefreshIcon } from '../../Icon';
import {
    useInvalidateActiveWalletQueries,
    useInvalidateGlobalQueries
} from '../../../state/wallet';
import { DropDown } from '../../DropDown';
import { useElementSize } from '../../../hooks/useElementSize';

const Body3Block = styled(Body3)`
    display: block;
`;

export const SubscriptionStatus: FC<{ data: ProState }> = ({ data }) => {
    const { t } = useTranslation();
    const formatDate = useDateTimeFormat();

    const { subscription } = data;

    if (isTrialSubscription(subscription)) {
        return (
            <>
                <Body3Block>{t('aside_pro_trial_is_active')}</Body3Block>
                <Body3Block>
                    {t('aside_expires_on').replace(
                        '%date%',
                        formatDate(subscription.trialEndDate, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            inputUnit: 'seconds'
                        })
                    )}
                </Body3Block>
            </>
        );
    }

    if (isValidSubscription(subscription)) {
        return (
            <>
                <Body3Block>{t('aside_pro_subscription_is_active')}</Body3Block>
                <Body3Block>
                    {t('aside_expires_on').replace(
                        '%date%',
                        formatDate(subscription.nextChargeDate, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            inputUnit: 'seconds'
                        })
                    )}
                </Body3Block>
            </>
        );
    }
    return null;
};

const Container = styled.div`
    .pro-subscription-dd-container {
        left: 0;
        right: unset;
        top: unset;
        bottom: calc(100% + 4px);
        width: fit-content;
    }
`;

const Divider = styled.div`
    background-color: ${p => p.theme.separatorCommon};
    height: 1px;
    width: calc(100% + 16px);
    margin: 0 -8px 8px;
`;

const BlockWrapper = styled.div`
    border-top: ${p => p.theme.separatorCommon};
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const RefreshIconRotating = styled(RefreshIcon)<{ rotate: boolean }>`
    ${p =>
        p.rotate &&
        css`
            animation: rotate 1s infinite linear;
        `};

    @keyframes rotate {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
`;

const DDContent = styled.div<{ width: number }>`
    background: ${p => p.theme.backgroundContentTint};
    padding: 8px 12px;
    border-radius: ${p => p.theme.corner2xSmall};
    color: ${p => p.theme.textSecondary};
    width: ${p => p.width}px;
    box-sizing: border-box;
`;

export const SubscriptionInfoBlock: FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    const { data } = useProState();
    const { onOpen } = useProFeaturesNotification();
    const { mutate: invalidateActiveWalletQueries, isLoading: isInvalidating } =
        useInvalidateActiveWalletQueries();
    const { mutate: invalidateGlobalQueries, isLoading: isInvalidatingGlobalQueries } =
        useInvalidateGlobalQueries();
    const [rotate, setRotate] = useState(false);
    const [containerRef, { width }] = useElementSize();

    const onRefresh = () => {
        if (rotate) {
            return;
        }

        setRotate(true);
        setTimeout(() => {
            setRotate(false);
        }, 1000);
        invalidateActiveWalletQueries();
        invalidateGlobalQueries();
    };

    let button = <Button loading>Pro</Button>;
    if (data) {
        if (data.subscription.valid) {
            button = (
                <DropDown
                    containerClassName="pro-subscription-dd-container"
                    payload={() => (
                        <DDContent width={width}>
                            <SubscriptionStatus data={data} />
                        </DDContent>
                    )}
                >
                    <Button>Pro</Button>
                </DropDown>
            );
        } else {
            button = (
                <Button primary onClick={onOpen}>
                    {t('pro_subscription_get_pro')}
                </Button>
            );
        }
    }

    return (
        <Container className={className} ref={containerRef}>
            <Divider />
            <BlockWrapper>
                {button}
                <IconButtonTransparentBackground
                    onClick={onRefresh}
                    disabled={isInvalidating || isInvalidatingGlobalQueries}
                >
                    <RefreshIconRotating rotate={rotate} />
                </IconButtonTransparentBackground>
            </BlockWrapper>
        </Container>
    );
};
