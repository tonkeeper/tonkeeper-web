import {
    Notification,
    NotificationBlock,
    NotificationFooter,
    NotificationFooterPortal
} from '../Notification';
import { createModalControl } from './createModalControl';
import React, { FC, useLayoutEffect, useMemo } from 'react';
import { useTranslation } from '../../hooks/translation';
import { useAtom } from '../../libs/atom';
import { useAppSdk } from '../../hooks/appSdk';
import { EmulationList } from '../connect/EstimationLayout';
import { Label2 } from '../Text';
import { ResultButton } from '../transfer/common';
import { CheckmarkCircleIcon, ExclamationMarkCircleIcon } from '../Icon';
import { Button } from '../fields/Button';
import { useEstimateExisitingMultisigOrder } from '../../hooks/blockchain/multisig/useEstimateExisitingMultisigOrder';
import { MultisigOrder } from '@tonkeeper/core/dist/tonApiV2';
import { NotificationSkeleton } from '../Skeleton';
import styled, { css } from 'styled-components';
import { useSendExisitingMultisigOrder } from '../../hooks/blockchain/multisig/useSendExisitingMultisigOrder';
import { MultisigTransferDetails } from '../transfer/multisig/MultisigTransferDetails';
import {
    useActiveMultisigAccountHost,
    useActiveMultisigWalletInfo,
    useOrderInfo,
    useOrderSignedBy
} from '../../state/multisig';
import { MultisigConfigDiff } from '../multisig/MultisigConfigDiff';
import { Address } from '@ton/core';
import { BorderSmallResponsive } from '../shared/Styles';
import { AppRoute } from '../../libs/routes';
import { useNavigate } from '../../hooks/router/useNavigate';

const ButtonGap = styled.div`
    ${props =>
        props.theme.displayType === 'full-width'
            ? css`
                  height: 1rem;
              `
            : css`
                  display: none;
              `}
`;

const ButtonRowStyled = styled.div`
    display: flex;
    gap: 1rem;
    width: 100%;

    & > * {
        flex: 1;
    }
`;

const ExclamationMarkCircleIconStyled = styled(ExclamationMarkCircleIcon)`
    min-width: 32px;
    min-height: 32px;
`;

const ResultButtonErrored = styled(ResultButton)`
    height: fit-content;
`;

const AlreadySignedButton = styled(ResultButton)`
    flex-direction: row;
    justify-content: center;
    margin-bottom: 16px;
    height: fit-content;

    color: ${props => props.theme.textPrimary};

    svg {
        width: 16px;
        height: 16px;
        color: ${props => (props.done ? props.theme.accentGreen : props.theme.accentRed)};
    }
`;

const MultisigConfigDiffStyled = styled(MultisigConfigDiff)`
    background-color: ${p => p.theme.backgroundContent};
    padding: 8px 12px;
    ${BorderSmallResponsive};
    width: 100%;
    box-sizing: border-box;
`;

const NotificationContentMultisigProvider: FC<{
    orderAddress: MultisigOrder['address'];
    handleClose: () => void;
}> = ({ orderAddress, handleClose }) => {
    const { data: multisig } = useActiveMultisigWalletInfo();

    const order = multisig?.orders.find(o => o.address === orderAddress);

    if (!order) {
        return null;
    }

    return <NotificationContent order={order} handleClose={handleClose} />;
};

const NotificationContent: FC<{
    order: MultisigOrder;
    handleClose: () => void;
}> = ({ order, handleClose }) => {
    const sdk = useAppSdk();

    const { t } = useTranslation();
    const orderInfo = useOrderInfo(order);
    const { data: signedBy } = useOrderSignedBy(order.address);
    const { data: multisig } = useActiveMultisigWalletInfo();
    const { signerWallet } = useActiveMultisigAccountHost();

    const pendingWallets = useMemo(() => {
        if (!signedBy) {
            return undefined;
        }

        return order.signers.filter(v => !signedBy.includes(v));
    }, [signedBy, order.signers]);

    const {
        mutate: estimate,
        data: estimation,
        isError
    } = useEstimateExisitingMultisigOrder(order.address);
    const {
        mutateAsync,
        isLoading,
        error: sendError,
        data: sendResult
    } = useSendExisitingMultisigOrder(order.address);

    const navigate = useNavigate();

    const onSubmit = async () => {
        try {
            await mutateAsync();
            sdk.hapticNotification('success');
            setTimeout(() => {
                handleClose();
                navigate(AppRoute.activity);
            }, 300);
        } catch (e) {
            setTimeout(() => handleClose(), 3000);
            console.error(e);
        }
    };

    useLayoutEffect(() => {
        estimate();
    }, [estimate, order.address]);

    const currentConfig = useMemo(() => {
        if (!multisig) {
            return undefined;
        }

        return {
            proposers: [] as Address[],
            signers: multisig.signers.map(v => Address.parse(v)),
            threshold: multisig.threshold
        };
    }, [multisig]);

    if (!estimation || !multisig || !currentConfig || !signedBy || !pendingWallets) {
        return <NotificationSkeleton handleClose={handleClose} />;
    }

    const done = sendResult !== undefined;

    const alreadySignedByUser = signedBy.includes(signerWallet.rawAddress);

    let bottom;
    switch (true) {
        case orderInfo.status !== 'progress':
            bottom = (
                <ButtonRowStyled>
                    <Button size="large" type="button" onClick={() => handleClose()}>
                        {t('close')}
                    </Button>
                </ButtonRowStyled>
            );
            break;
        case alreadySignedByUser:
            bottom = (
                <AlreadySignedButton done>
                    <CheckmarkCircleIcon />
                    <Label2>{t('multisig_you_have_signed_the_request')}</Label2>
                </AlreadySignedButton>
            );
            break;
        case !!sendError:
            bottom = (
                <ResultButtonErrored>
                    <ExclamationMarkCircleIconStyled />
                    <Label2>{t('error_occurred')}</Label2>
                </ResultButtonErrored>
            );
            break;
        case done:
            bottom = (
                <ResultButton done>
                    <CheckmarkCircleIcon />
                    <Label2>{t('ton_login_success')}</Label2>
                </ResultButton>
            );
            break;
        default:
            bottom = (
                <ButtonRowStyled>
                    <Button
                        size="large"
                        type="button"
                        loading={isLoading}
                        disabled={isLoading}
                        onClick={() => handleClose()}
                    >
                        {t('notifications_alert_cancel')}
                    </Button>
                    <Button
                        size="large"
                        type="button"
                        primary
                        loading={isLoading}
                        disabled={isLoading}
                        onClick={onSubmit}
                    >
                        {t('confirm_sending_sign')}
                    </Button>
                </ButtonRowStyled>
            );
    }

    return (
        <NotificationBlock>
            {estimation.type === 'transfer' && (
                <EmulationList isError={isError} event={estimation?.event} />
            )}
            {estimation?.type === 'update' && (
                <MultisigConfigDiffStyled
                    prevConfig={currentConfig}
                    newConfig={estimation.config}
                />
            )}
            <MultisigTransferDetails
                {...orderInfo}
                threshold={multisig.threshold}
                signedWallets={signedBy}
                pendingWallets={pendingWallets}
                hostAddress={signerWallet.rawAddress}
                orderAddress={order.address}
            />
            <ButtonGap />
            <NotificationFooterPortal>
                <NotificationFooter>{bottom}</NotificationFooter>
            </NotificationFooterPortal>
        </NotificationBlock>
    );
};

const { hook, paramsControl } = createModalControl<{
    orderAddress: MultisigOrder['address'];
}>();

export const useMultisigOrderNotification = hook;

export const MultisigOrderNotificationControlled = () => {
    const { isOpen, onClose } = useMultisigOrderNotification();
    const { t } = useTranslation();
    const [params] = useAtom(paramsControl);

    if (!params?.orderAddress) {
        return null;
    }

    return (
        <Notification
            isOpen={isOpen}
            handleClose={onClose}
            title={t('multisig_order_notification_title')}
        >
            {() => (
                <NotificationContentMultisigProvider
                    orderAddress={params.orderAddress}
                    handleClose={onClose}
                />
            )}
        </Notification>
    );
};
