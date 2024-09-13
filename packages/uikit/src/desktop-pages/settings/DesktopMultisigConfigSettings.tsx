import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { Body2, Label2 } from '../../components/Text';
import { styled } from 'styled-components';

import { useTranslation } from '../../hooks/translation';
import { useIsScrolled } from '../../hooks/useIsScrolled';
import {
    useActiveMultisigAccountHost,
    useActiveMultisigWalletInfo,
    useIsActiveAccountMultisig
} from '../../state/multisig';
import { Navigate } from 'react-router-dom';
import { AppRoute } from '../../libs/routes';
import { SkeletonListDesktopAdaptive } from '../../components/Skeleton';
import React, { FC, useId, useMemo } from 'react';
import { Multisig } from '@tonkeeper/core/dist/tonApiV2';
import { Button } from '../../components/fields/Button';
import { formatAddress } from '@tonkeeper/core/dist/utils/common';
import { FormProvider, useForm } from 'react-hook-form';
import { Address } from '@ton/core';
import { useMultisigChangeConfigNotification } from '../../components/modals/MultisigChangeConfigNotificationControlled';
import { MultisigConfigForm, MultisigUseForm } from '../../components/multisig/MultisigConfigForm';

const DesktopViewPageLayoutStyled = styled(DesktopViewPageLayout)`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

export const DesktopMultisigConfigSettingsPage = () => {
    const { ref: scrollRef, closeTop } = useIsScrolled();
    const { t } = useTranslation();
    const isAccountMultisig = useIsActiveAccountMultisig();

    if (!isAccountMultisig) {
        return <Navigate to={AppRoute.home} />;
    }

    return (
        <DesktopViewPageLayoutStyled ref={scrollRef}>
            <DesktopViewHeader backButton borderBottom={!closeTop}>
                <Label2>{t('settings_multisig_settings')}</Label2>
            </DesktopViewHeader>
            <DesktopMultisigConfigSettingsProvider />
        </DesktopViewPageLayoutStyled>
    );
};

const DesktopMultisigConfigSettingsProvider = () => {
    const { data: multisig } = useActiveMultisigWalletInfo();
    const { signerWallet } = useActiveMultisigAccountHost();

    if (!multisig || !signerWallet) {
        return <SkeletonListDesktopAdaptive size={3} />;
    }

    return (
        <DesktopMultisigConfigSettingsContent
            multisig={multisig}
            signerWallet={signerWallet.rawAddress}
        />
    );
};

const ContentWrapper = styled.div`
    padding: 1rem;
`;

const ButtonContainer = styled.div`
    display: flex;
    padding: 16px 0;
    gap: 12px;
    align-items: center;
`;

const Body2Secondary = styled(Body2)`
    color: ${props => props.theme.textSecondary};
`;

const formChanged = (current: MultisigUseForm, previous: MultisigUseForm) => {
    if (current.firstParticipant !== previous.firstParticipant) {
        return true;
    }
    if (current.quorum !== previous.quorum) {
        return true;
    }
    if (current.participants.length !== previous.participants.length) {
        return true;
    }
    try {
        if (
            current.participants.some(p =>
                previous.participants.every(
                    v => !Address.parse(p.address).equals(Address.parse(v.address))
                )
            )
        ) {
            return true;
        }
    } catch (e) {
        return false;
    }

    return false;
};

export const DesktopMultisigConfigSettingsContent: FC<{
    multisig: Multisig;
    signerWallet: string;
}> = ({ multisig, signerWallet }) => {
    const { t } = useTranslation();
    const formId = useId();
    const signaturesRequired = multisig.threshold - 1;

    const defaultValues = useMemo<MultisigUseForm>(() => {
        return {
            firstParticipant: signerWallet,
            participants: multisig.signers
                .filter(s => s !== signerWallet)
                .map(address => ({ address: formatAddress(address) })),
            quorum: multisig.threshold
        };
    }, [multisig, signerWallet]);

    const methods = useForm<MultisigUseForm>({
        defaultValues
    });

    const currentFormValue = methods.getValues();

    const { onOpen } = useMultisigChangeConfigNotification();

    return (
        <ContentWrapper>
            <FormProvider {...methods}>
                <MultisigConfigForm
                    onSubmit={form => onOpen({ form })}
                    formId={formId}
                    defaultValues={defaultValues}
                    skipBalanceCheck
                />
            </FormProvider>
            <ButtonContainer>
                <Button
                    primary
                    type="submit"
                    fitContent
                    form={formId}
                    disabled={!formChanged(currentFormValue, defaultValues)}
                >
                    {t('multisig_edit_suggest_changes')}
                </Button>
                {signaturesRequired > 0 && (
                    <Body2Secondary>
                        {t('multisig_edit_submit_hint', { number: signaturesRequired })}
                    </Body2Secondary>
                )}
            </ButtonContainer>
        </ContentWrapper>
    );
};
