import styled, { css } from 'styled-components';
import { FC, useMemo } from 'react';
import { DoneIcon, DotIcon, ResponsiveSpinner } from '../Icon';
import { Body2, Body2Class } from '../Text';
import { LedgerIcon } from './LedgerIcons';
import { Dot } from '../Dot';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useActiveConfig } from '../../state/wallet';

const CardStyled = styled.div`
    box-sizing: border-box;
    max-width: 368px;
    background: ${p => p.theme.backgroundContent};
    border-radius: ${p =>
        p.theme.displayType === 'full-width' ? p.theme.corner2xSmall : p.theme.cornerSmall};
`;

const TextStepsContainer = styled.div`
    box-sizing: border-box;
    width: 100%;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

const TextBlockStyled = styled.div`
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
`;

const Body2Colored = styled(Body2)<{ isCompleted?: boolean }>`
    ${p =>
        p.isCompleted &&
        css`
            color: ${p.theme.accentGreen};
        `};
`;

const IconContainer = styled.div`
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const ImageStyled = styled.div`
    padding-top: 45px;
    padding-bottom: 32px;
`;

const AStyled = styled.span`
    cursor: pointer;
    ${Body2Class};
    color: ${p => p.theme.textSecondary};
    text-decoration: unset;

    &:hover {
        text-decoration: underline;
    }
`;

export const LedgerConnectionSteps: FC<{
    transactionsToSign?: number;
    signingTransactionIndex?: number;
    action?: 'transaction' | 'ton-proof';
    currentStep: 'connect' | 'open-ton' | 'confirm-tx' | 'all-completed';
    className?: string;
}> = ({ currentStep, transactionsToSign, signingTransactionIndex, className, action }) => {
    const config = useActiveConfig();
    const { t } = useTranslation();

    const sdk = useAppSdk();

    const onOpenFaq = () => {
        const enPath = 'article/86-how-to-connect-ledger-to-tonkeeper';

        let faqBaseUrl = config.faq_url || 'https://tonkeeper.helpscoutdocs.com';
        if (!faqBaseUrl.endsWith('/')) {
            faqBaseUrl = faqBaseUrl + '/';
        }

        sdk.openPage(faqBaseUrl + enPath);
    };

    const txToSignIndexes = useMemo(
        () => new Array(transactionsToSign).fill(0).map((_, i) => i),
        [transactionsToSign]
    );

    return (
        <CardStyled className={className}>
            <ImageStyled>
                <LedgerIcon
                    step={
                        currentStep !== 'all-completed'
                            ? currentStep
                            : transactionsToSign
                            ? 'confirm-tx'
                            : 'open-ton'
                    }
                />
            </ImageStyled>
            <TextStepsContainer>
                <TextBlockStyled>
                    <StepIcon state={currentStep === 'connect' ? 'active' : 'completed'} />
                    <Body2Colored isCompleted={currentStep !== 'connect'}>
                        {t('ledger_steps_connect')}
                    </Body2Colored>
                </TextBlockStyled>
                <TextBlockStyled>
                    <StepIcon
                        state={
                            currentStep === 'open-ton'
                                ? 'active'
                                : currentStep === 'connect'
                                ? 'future'
                                : 'completed'
                        }
                    />
                    <Body2Colored
                        isCompleted={
                            currentStep === 'all-completed' || currentStep === 'confirm-tx'
                        }
                    >
                        {t('ledger_steps_open_ton')}
                        {!transactionsToSign && (
                            <>
                                <Dot />
                                <AStyled onClick={onOpenFaq}>
                                    {t('ledger_steps_install_ton')}
                                </AStyled>
                            </>
                        )}
                    </Body2Colored>
                </TextBlockStyled>
                {transactionsToSign === 1 || action === 'ton-proof' ? (
                    <TextBlockStyled>
                        <StepIcon
                            state={
                                currentStep === 'confirm-tx'
                                    ? 'active'
                                    : currentStep === 'connect' || currentStep === 'open-ton'
                                    ? 'future'
                                    : 'completed'
                            }
                        />
                        <Body2Colored isCompleted={currentStep === 'all-completed'}>
                            {t(
                                action === 'ton-proof'
                                    ? 'ledger_steps_confirm_proof'
                                    : 'ledger_steps_confirm_tx'
                            )}
                        </Body2Colored>
                    </TextBlockStyled>
                ) : transactionsToSign && transactionsToSign > 1 ? (
                    txToSignIndexes.map(index => (
                        <TextBlockStyled key={index}>
                            <StepIcon
                                state={
                                    currentStep === 'connect' ||
                                    currentStep === 'open-ton' ||
                                    (currentStep === 'confirm-tx' &&
                                        index > signingTransactionIndex!)
                                        ? 'future'
                                        : currentStep === 'confirm-tx' &&
                                          signingTransactionIndex === index
                                        ? 'active'
                                        : 'completed'
                                }
                            />
                            <Body2Colored
                                isCompleted={
                                    currentStep === 'all-completed' ||
                                    index < signingTransactionIndex!
                                }
                            >
                                {t('ledger_steps_confirm_num_tx', { number: index + 1 })}
                            </Body2Colored>
                        </TextBlockStyled>
                    ))
                ) : null}
            </TextStepsContainer>
        </CardStyled>
    );
};

const DoneIconStyled = styled(DoneIcon)`
    color: ${p => p.theme.accentGreen};
`;

const StepIcon: FC<{ state: 'future' | 'active' | 'completed' }> = ({ state }) => {
    if (state === 'future') {
        return (
            <IconContainer>
                <DotIcon color="iconTertiary" />
            </IconContainer>
        );
    }

    if (state === 'active') {
        return (
            <IconContainer>
                <ResponsiveSpinner />
            </IconContainer>
        );
    }

    return (
        <IconContainer>
            <DoneIconStyled />
        </IconContainer>
    );
};
