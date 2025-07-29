import { styled } from 'styled-components';
import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import React, { useCallback, useEffect, useState } from 'react';
import { useConnectLedgerMutation } from '@tonkeeper/uikit/dist/state/ledger';
import {
    NotificationFooter,
    NotificationFooterPortal
} from '@tonkeeper/uikit/dist/components/Notification';
import { LedgerConnectionSteps } from '@tonkeeper/uikit/dist/components/ledger/LedgerConnectionSteps';
import { ButtonResponsiveSize, H2 } from '@tonkeeper/uikit';
import { useLocation } from 'react-router-dom';
import { getOpenedPopup } from '@tonkeeper/core/dist/service/extensionPopupStorage';
import browser from 'webextension-polyfill';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { AppRoute } from '@tonkeeper/uikit/dist/libs/routes';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    flex: 1;
    height: 100%;
    padding: 20px;
`;

const H2Styled = styled(H2)`
    margin-bottom: 1rem;
`;

const ButtonsBlock = styled.div`
    margin-top: 1rem;
    display: flex;
    gap: 8px;
    width: 100%;

    > * {
        flex: 1;
    }
`;

const ConnectLedgerPage = () => {
    const { t } = useTranslation();
    const [tried, setTried] = useState(false);
    const sdk = useAppSdk();

    const {
        isDeviceConnected,
        mutate: connectLedger,
        reset: resetConnection,
        data: tonTransport,
        isError: isConnectionError
    } = useConnectLedgerMutation();

    const onAfterCompleted = useCallback(async () => {
        try {
            const popup = await getOpenedPopup(sdk.storage);
            if (popup?.id !== undefined) {
                await browser.windows.update(popup.id, { focused: true });
            }
        } catch (e) {
            console.error(e);
        }
        window.close();
    }, []);

    const location = useLocation();
    useEffect(() => {
        if (location.pathname !== AppRoute.connectLedger) {
            onAfterCompleted();
        }
    }, [location.pathname, onAfterCompleted]);

    useEffect(() => {
        if (isDeviceConnected) {
            onAfterCompleted();
        }
    }, [onAfterCompleted, isDeviceConnected]);

    const onStartConnection = useCallback(() => {
        resetConnection();
        connectLedger();
        setTried(true);
    }, []);

    let currentStep: 'connect' | 'open-ton' | 'all-completed' = 'connect';
    if (isDeviceConnected) {
        currentStep = 'open-ton';
    }
    if (tonTransport) {
        currentStep = 'all-completed';
    }

    return (
        <Wrapper>
            <H2Styled>{t('ledger_connect_header')}</H2Styled>
            <LedgerConnectionSteps
                currentStep={currentStep}
                isErrored={isConnectionError}
                pristine={!tried}
            />
            <NotificationFooterPortal>
                <NotificationFooter>
                    <ButtonsBlock>
                        <ButtonResponsiveSize secondary onClick={onAfterCompleted}>
                            {t('cancel')}
                        </ButtonResponsiveSize>
                        <ButtonResponsiveSize primary onClick={onStartConnection}>
                            {t(tried ? 'try_again' : 'continue')}
                        </ButtonResponsiveSize>
                    </ButtonsBlock>
                </NotificationFooter>
            </NotificationFooterPortal>
        </Wrapper>
    );
};

export default ConnectLedgerPage;
