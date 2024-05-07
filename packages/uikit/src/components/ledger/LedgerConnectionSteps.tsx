import styled, { css } from 'styled-components';
import { FC } from 'react';
import { DoneIcon, DotIcon, ResponsiveSpinner } from '../Icon';
import { Body2, Body2Class } from '../Text';
import { LedgerIcon } from './LedgerIcons';
import { Dot } from '../Dot';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';

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
    showConfirmTxStep?: boolean;
    currentStep: 'connect' | 'open-ton' | 'confirm-tx' | 'all-completed';
    className?: string;
}> = ({ currentStep, showConfirmTxStep, className }) => {
    const { config } = useAppContext();
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

    return (
        <CardStyled className={className}>
            <ImageStyled>
                <LedgerIcon
                    step={
                        currentStep !== 'all-completed'
                            ? currentStep
                            : showConfirmTxStep
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
                        {!showConfirmTxStep && (
                            <>
                                <Dot />
                                <AStyled onClick={onOpenFaq}>
                                    {t('ledger_steps_install_ton')}
                                </AStyled>
                            </>
                        )}
                    </Body2Colored>
                </TextBlockStyled>
                {showConfirmTxStep && (
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
                            {t('ledger_steps_confirm_tx')}
                        </Body2Colored>
                    </TextBlockStyled>
                )}
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
