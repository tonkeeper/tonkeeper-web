import { Notification, useSetNotificationOnBack } from '../Notification';
import { createModalControl } from './createModalControl';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../hooks/translation';
import { useAtom } from '../../libs/atom';
import { MainButton } from '../transfer/common';
import { MultisigOrderFormView } from '../transfer/MultisigOrderFormView';
import { MultisigOrderLifetimeMinutes } from '../../libs/multisig';
import {
    ConfirmView,
    ConfirmViewAdditionalBottomSlot,
    ConfirmViewDetailsSlot,
    ConfirmViewHeadingSlot,
    ConfirmViewTitleSlot
} from '../transfer/ConfirmView';
import { useEstimateChangeMultisigConfig } from '../../hooks/blockchain/multisig/useEstimateChangeMultisigConfig';
import { MultisigConfig } from '@tonkeeper/core/dist/service/multisig/deploy';
import { Address } from '@ton/core';
import { useSendChangeMultisigConfig } from '../../hooks/blockchain/multisig/useSendChangeMultisigConfig';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { MultisigConfigDiff } from '../multisig/MultisigConfigDiff';
import { MultisigUseForm } from '../multisig/MultisigConfigForm';
import { useActiveMultisigAccountHost, useActiveMultisigWalletInfo } from '../../state/multisig';
import { SpinnerRing } from '../Icon';
import { styled } from 'styled-components';
import { MultisigTransferDetails } from '../transfer/multisig/MultisigTransferDetails';
import { Body2 } from '../Text';
import { AppRoute } from '../../libs/routes';
import { useNavigate } from 'react-router-dom';

const { hook, paramsControl } = createModalControl<{
    form: MultisigUseForm;
}>();

export const useMultisigChangeConfigNotification = hook;

const MultisigConfigDiffStyled = styled(MultisigConfigDiff)`
    padding: 8px 12px;
`;

const Body2Secondary = styled(Body2)`
    color: ${p => p.theme.textSecondary};
`;

const ConfirmViewStyled = styled(ConfirmView)`
    padding-bottom: 0;
`;

const NotificationContent: FC<{ onClose: () => void; config: MultisigUseForm }> = ({
    onClose,
    config
}) => {
    const { data: multisig } = useActiveMultisigWalletInfo();
    const { signerWallet } = useActiveMultisigAccountHost();
    const newConfig: Omit<MultisigConfig, 'allowArbitrarySeqno'> = useMemo(
        () => ({
            proposers: [],
            signers: config.participants
                .map(p => p.address)
                .concat(config.firstParticipant)
                .map(v => Address.parse(v)),
            threshold: config.quorum
        }),
        [config]
    );
    const { t } = useTranslation();
    const [ttlMinutes, setTtlMinutes] = useState<MultisigOrderLifetimeMinutes | undefined>();

    const estimation = useEstimateChangeMultisigConfig();
    const sendMutation = useSendChangeMultisigConfig(newConfig, ttlMinutes);

    useEffect(() => {
        if (ttlMinutes !== undefined) {
            estimation.mutate({ newConfig, ttlMinutes });
        }
    }, [newConfig, ttlMinutes]);

    const onNotificationBack = useMemo(() => {
        if (ttlMinutes === undefined) {
            return undefined;
        }

        return () => setTtlMinutes(undefined);
    }, [ttlMinutes]);

    useSetNotificationOnBack(onNotificationBack);

    const currentConfig = useMemo(() => {
        if (!multisig) {
            return undefined;
        }

        return {
            proposers: [],
            signers: multisig.signers.map(v => Address.parse(v)),
            threshold: multisig.threshold
        };
    }, [multisig]);

    const navigate = useNavigate();
    const onConfirmViewClosed = useCallback(
        (confirmed?: boolean) => {
            onClose();
            if (confirmed) {
                navigate(AppRoute.activity);
            }
        },
        [navigate, onClose]
    );
    return (
        <>
            {ttlMinutes === undefined ? (
                <MultisigOrderFormView
                    onSubmit={v => setTtlMinutes(v.lifetime)}
                    isAnimationProcess={false}
                    MainButton={MainButton}
                />
            ) : currentConfig !== undefined ? (
                <ConfirmViewStyled
                    assetAmount={null as unknown as AssetAmount}
                    onClose={onConfirmViewClosed}
                    estimation={estimation}
                    {...sendMutation}
                >
                    <ConfirmViewTitleSlot />
                    <ConfirmViewHeadingSlot>
                        <Body2Secondary>{t('multisig_update_config_confirm_title')}</Body2Secondary>
                    </ConfirmViewHeadingSlot>
                    <ConfirmViewDetailsSlot>
                        <MultisigConfigDiffStyled
                            newConfig={newConfig}
                            prevConfig={currentConfig}
                        />
                    </ConfirmViewDetailsSlot>
                    <ConfirmViewAdditionalBottomSlot>
                        <MultisigTransferDetails
                            status="progress"
                            signedWallets={[]}
                            pendingWallets={multisig!.signers}
                            hostAddress={signerWallet.rawAddress}
                            secondsLeft={Number(ttlMinutes) * 60}
                        />
                    </ConfirmViewAdditionalBottomSlot>
                </ConfirmViewStyled>
            ) : (
                <SpinnerRing />
            )}
        </>
    );
};

export const MultisigChangeConfigNotificationControlled = () => {
    const { isOpen, onClose } = useMultisigChangeConfigNotification();
    const { t } = useTranslation();
    const [params] = useAtom(paramsControl);

    const Content = useCallback(() => {
        if (!params?.form) {
            return null;
        }

        return <NotificationContent config={params.form} onClose={onClose} />;
    }, [onClose, params?.form]);

    return (
        <Notification
            isOpen={isOpen}
            handleClose={onClose}
            title={t('multisig_order_notification_title')}
        >
            {Content}
        </Notification>
    );
};
