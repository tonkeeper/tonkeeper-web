import { FC, useState } from 'react';
import styled, { css } from 'styled-components';
import {
    isPendingSubscription,
    isProSubscription,
    isTelegramSubscription,
    isValidSubscription,
    ProState
} from '@tonkeeper/core/dist/entries/pro';

import { useTranslation } from '../../../hooks/translation';
import { useDateTimeFormat } from '../../../hooks/useDateTimeFormat';
import { useProState } from '../../../state/pro';
import { Body3 } from '../../Text';
import { Button } from '../../fields/Button';
import { useProFeaturesNotification } from '../../modals/ProFeaturesNotificationControlled';
import { IconButtonTransparentBackground } from '../../fields/IconButton';
import { RefreshIcon, SpinnerIcon } from '../../Icon';
import {
    useInvalidateActiveWalletQueries,
    useInvalidateGlobalQueries
} from '../../../state/wallet';
import { DropDown } from '../../DropDown';
import { useElementSize } from '../../../hooks/useElementSize';
import { NotForTargetEnv } from '../../shared/TargetEnv';
import { useHideActiveBrowserTab } from '../../../state/dapp-browser';

const Body3Block = styled(Body3)`
    display: block;
`;

export const SubscriptionStatus: FC<{ data: ProState }> = ({ data }) => {
    const { t } = useTranslation();
    const formatDate = useDateTimeFormat();

    const { subscription } = data;

    if (isTelegramSubscription(subscription) && subscription.trialEndDate) {
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

    if (isProSubscription(subscription) && subscription.nextChargeDate) {
        return (
            <>
                <Body3Block>{t('aside_pro_subscription_is_active')}</Body3Block>
                <Body3Block>
                    {t('aside_expires_on').replace(
                        '%date%',
                        subscription.nextChargeDate
                            ? formatDate(subscription.nextChargeDate, {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  inputUnit: 'seconds'
                              })
                            : ''
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

const ProButtonPanel = styled(Button)`
    padding: 0 12px;
    cursor: default;

    &:hover {
        background-color: ${p => p.theme.buttonTertiaryBackground};
    }
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

    const { mutate: hideBrowser } = useHideActiveBrowserTab();
    const onGetPro = async () => {
        hideBrowser();
        onOpen();
    };

    let button = <Button loading>Tonkeeper Pro</Button>;

    if (data && isValidSubscription(data.subscription)) {
        button = (
            <DropDown
                containerClassName="pro-subscription-dd-container"
                payload={() => (
                    <DDContent width={width}>
                        <SubscriptionStatus data={data} />
                    </DDContent>
                )}
                trigger="hover"
            >
                <ProButtonPanel>Tonkeeper Pro</ProButtonPanel>
            </DropDown>
        );
    } else {
        const isProcessing =
            data &&
            isProSubscription(data?.subscription) &&
            isPendingSubscription(data?.subscription);

        button = isProcessing ? (
            <DropDown
                containerClassName="pro-subscription-dd-container"
                payload={() => (
                    <DDContent width={width}>
                        {t('create_multisig_await_deployment_description')}
                    </DDContent>
                )}
                trigger="hover"
            >
                <ProButtonPanel>
                    <SpinnerIcon />
                    {t('processing')}
                </ProButtonPanel>
            </DropDown>
        ) : (
            <Button primary onClick={onGetPro}>
                {t('get_tonkeeper_pro')}
            </Button>
        );
    }

    return (
        <Container className={className} ref={containerRef}>
            <NotForTargetEnv env="mobile">
                <Divider />
            </NotForTargetEnv>
            <BlockWrapper>
                {button}
                <NotForTargetEnv env="mobile">
                    <IconButtonTransparentBackground
                        onClick={onRefresh}
                        disabled={isInvalidating || isInvalidatingGlobalQueries}
                    >
                        <RefreshIconRotating rotate={rotate} />
                    </IconButtonTransparentBackground>
                </NotForTargetEnv>
            </BlockWrapper>
        </Container>
    );
};
