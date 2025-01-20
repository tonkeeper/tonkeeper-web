import { FC } from 'react';
import { InnerBody } from '../../components/Body';
import { SubHeader } from '../../components/SubHeader';
import { Body2, Body3Class, Label2 } from '../../components/Text';
import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import styled from 'styled-components';
import { ExclamationMarkTriangleIcon, SpinnerRing } from '../../components/Icon';
import { useTranslation } from '../../hooks/translation';
import { ErrorBoundary } from 'react-error-boundary';
import { fallbackRenderOver } from '../../components/Error';
import { AppRoute } from '../../libs/routes';
import {
    useCanViewTwoFA,
    useGetBoundingTwoFABotLink,
    useIsTwoFAActivationProcess,
    useIsTwoFACancelRecoveryProcess,
    useIsTwoFARemovingProcess,
    useTwoFAWalletConfig
} from '../../state/two-fa';
import { hexToRGBA } from '../../libs/css';
import { BorderSmallResponsive } from '../../components/shared/Styles';
import { TwoFASetUp } from '../../components/settings/two-fa/TwoFASetUp';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { Button } from '../../components/fields/Button';
import { DisableTwoFAConfirmNotification } from '../../components/settings/two-fa/DisableTwoFAConfirmNotification';
import { useDisclosure } from '../../hooks/useDisclosure';
import { TwoFAReConnectBotNotification } from '../../components/settings/two-fa/TwoFAConnectBotNotification';
import { useUserLanguage } from '../../state/language';
import { localizationText } from '@tonkeeper/core/dist/entries/language';
import { formattedDateTimeStamp } from '../../libs/dateTime';
import { useSendTwoFACancelRecovery } from '../../hooks/blockchain/two-fa/useSendTwoFCancelRecovery';
import { useSendTwoFARemove } from '../../hooks/blockchain/two-fa/useSendTwoFARemove';
import { Navigate } from "../../components/shared/Navigate";

export const TwoFAPage = () => {
    const canViewTwoFA = useCanViewTwoFA();

    if (!canViewTwoFA) {
        return <Navigate to={AppRoute.home} />;
    }

    return (
        <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display Two FA page')}>
            <TwoFAPageLayout />
        </ErrorBoundary>
    );
};

const ContentWrapper = styled.div`
    max-width: 468px;
    margin: 0 auto;
`;

const SpinnerWrapper = styled.div`
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const DesktopViewPageLayoutStyled = styled(DesktopViewPageLayout)`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

const TwoFAPageContentWrapper = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
`;

export const TwoFAPageLayout: FC = () => {
    const isFullWidth = useIsFullWidthMode();
    const { t } = useTranslation();

    if (isFullWidth) {
        return (
            <DesktopViewPageLayoutStyled>
                <DesktopViewHeader borderBottom backButton>
                    <Label2>{t('two_fa_long')}</Label2>
                </DesktopViewHeader>
                <TwoFAPageContentWrapper>
                    <TwoFAPageContent />
                </TwoFAPageContentWrapper>
            </DesktopViewPageLayoutStyled>
        );
    }

    return (
        <>
            <SubHeader title={t('two_fa_long')} />
            <InnerBody>
                <TwoFAPageContent />
            </InnerBody>
        </>
    );
};

const TextHeadingBlock = styled.div`
    display: flex;
    text-align: center;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    padding: 32px 0 16px;

    > ${Body2} {
        color: ${p => p.theme.textSecondary};
        text-wrap: balance;
    }
`;

const WarningBlock = styled.div`
    background: ${p => hexToRGBA(p.theme.accentOrange, 0.16)};
    color: ${p => p.theme.accentOrange};
    padding: 8px 4px;
    display: flex;
    ${BorderSmallResponsive};
    max-width: 496px;
    margin: 0 auto;
    justify-content: space-between;
`;

const ExclamationMarkTriangleIconStyled = styled(ExclamationMarkTriangleIcon)`
    padding: 4px 8px;
`;

const WarningBlockText = styled.ul`
    ${Body3Class};
    padding-left: 16px;
    margin: 0;
`;

const TwoFASetUpStyled = styled(TwoFASetUp)`
    margin: 16px auto 84px;
`;

const TwoFAPageContent: FC = () => {
    const { data: config } = useTwoFAWalletConfig();
    useIsTwoFACancelRecoveryProcess();
    useIsTwoFARemovingProcess();
    useIsTwoFAActivationProcess();

    if (config === undefined) {
        return (
            <SpinnerWrapper>
                <SpinnerRing />
            </SpinnerWrapper>
        );
    }

    switch (config?.status) {
        case undefined:
        case 'tg-bot-bounding':
        case 'ready-for-deployment':
            return <TwoFANotSetContent />;
        case 'active':
            return <TwoFAActiveContent />;
        case 'disabling':
            return (
                <TwoFADisablingContent
                    disablingDate={new Date(config.willBeDisabledAtUnixSeconds * 1000)}
                />
            );
        default:
            assertUnreachable(config);
    }
};

const TwoFANotSetContent = () => {
    const { t } = useTranslation();
    return (
        <div>
            <ContentWrapper>
                <TextHeadingBlock>
                    <Label2>{t('two_fa_settings_heading_title')}</Label2>
                    <Body2>{t('two_fa_settings_heading_description')}</Body2>
                </TextHeadingBlock>
            </ContentWrapper>
            <TwoFASetUpStyled />
            <WarningBlock>
                <WarningBlockText>
                    <li>{t('two_fa_settings_warning_can_not_recover')}</li>
                    <li>{t('two_fa_settings_warning_wallet_will_stop')}</li>
                    <li>{t('two_fa_settings_warning_balance_required')}</li>
                    <li>{t('two_fa_settings_warning_battery_gasless')}</li>
                </WarningBlockText>
                <ExclamationMarkTriangleIconStyled />
            </WarningBlock>
        </div>
    );
};

const ActionButtonsContainer = styled.div`
    display: flex;
    justify-content: center;
    margin: 0 auto 84px;
    gap: 8px;
`;

const TwoFAActiveContent = () => {
    const { t } = useTranslation();
    const {
        isOpen: isOpenDisconnect,
        onClose: onCloseDisconnect,
        onOpen: onOpenDisconnect
    } = useDisclosure();

    const {
        isOpen: isOpenReconnectTG,
        onClose: onCloseReconnectTG,
        onOpen: onOpenReconnectTG
    } = useDisclosure();

    const {
        mutateAsync: getReconnectTGLink,
        data: reconnectTGLink,
        reset: resetReconnectTGLink
    } = useGetBoundingTwoFABotLink({ forReconnect: true });

    const onClickReconnectTG = async () => {
        try {
            await getReconnectTGLink();
            onOpenReconnectTG();
        } catch (e) {
            console.error(e);
        }
    };

    const onClickCloseReconnectTG = () => {
        onCloseReconnectTG();
        setTimeout(resetReconnectTGLink, 300);
    };

    const { mutateAsync: removeTwoFA, isLoading: isRemovingLoading } = useSendTwoFARemove();
    const { data: isRemovingProcess } = useIsTwoFARemovingProcess();

    const onClickCloseDisconnect = async (confirmed?: boolean) => {
        onCloseDisconnect();
        if (!confirmed) {
            return;
        }

        await removeTwoFA();
    };

    return (
        <>
            <ContentWrapper>
                <TextHeadingBlock>
                    <Label2>{t('two_fa_settings_heading_active_title')}</Label2>
                    <Body2>{t('two_fa_settings_heading_active_description')}</Body2>
                </TextHeadingBlock>

                <ActionButtonsContainer>
                    <Button
                        secondary
                        onClick={onOpenDisconnect}
                        loading={isRemovingLoading || isRemovingProcess}
                    >
                        {t('two_fa_settings_disable_button')}
                    </Button>
                    <Button secondary onClick={onClickReconnectTG}>
                        {t('two_fa_settings_change_tg_button')}
                    </Button>
                </ActionButtonsContainer>
            </ContentWrapper>
            <WarningBlock>
                <WarningBlockText>
                    <li>{t('two_fa_settings_warning_can_not_recover')}</li>
                    <li>{t('two_fa_settings_warning_wallet_will_stop')}</li>
                    <li>{t('two_fa_settings_warning_balance_required')}</li>
                    <li>{t('two_fa_settings_warning_battery_gasless')}</li>
                </WarningBlockText>
                <ExclamationMarkTriangleIconStyled />
            </WarningBlock>
            <DisableTwoFAConfirmNotification
                isOpen={isOpenDisconnect}
                onClose={onClickCloseDisconnect}
            />
            <TwoFAReConnectBotNotification
                isOpen={isOpenReconnectTG}
                onClose={onClickCloseReconnectTG}
                authLink={reconnectTGLink}
            />
        </>
    );
};

const TwoFADisablingContent: FC<{ disablingDate: Date }> = ({ disablingDate }) => {
    const { t } = useTranslation();
    const { data } = useUserLanguage();
    const locale = localizationText(data) as unknown as ILocale;
    const { mutate, isLoading } = useSendTwoFACancelRecovery();

    const { data: isCancelRecoveryProcess } = useIsTwoFACancelRecoveryProcess();

    return (
        <>
            <ContentWrapper>
                <TextHeadingBlock>
                    <Label2>{t('two_fa_settings_heading_recovery_title')}</Label2>
                    <Body2>
                        {t('two_fa_settings_heading_recovery_description', {
                            date: formattedDateTimeStamp(disablingDate, locale)
                        })}
                    </Body2>
                </TextHeadingBlock>

                <ActionButtonsContainer>
                    <Button
                        primary
                        onClick={() => mutate()}
                        loading={isLoading || isCancelRecoveryProcess}
                    >
                        {t('two_fa_settings_cancel_recovery_button')}
                    </Button>
                </ActionButtonsContainer>
            </ContentWrapper>
        </>
    );
};
