import styled from 'styled-components';
import { useTranslation } from '../../../hooks/translation';
import { usePreFetchRates } from '../../../state/rates';
import { useActiveAccount, useActiveTonNetwork } from '../../../state/wallet';
import { fallbackRenderOver } from '../../Error';
import { PlusIconSmall } from '../../Icon';
import { Button } from '../../fields/Button';
import { useAccountTotalBalance } from '../../../state/asset';
import { DesktopHeaderBalance, DesktopHeaderContainer } from './DesktopHeaderElements';
import { useMAMIndexesSettingsNotification } from '../../modals/MAMIndexesSettingsNotification';
import { ErrorBoundary } from '../../shared/ErrorBoundary';

const ButtonsContainer = styled.div`
    display: flex;
    gap: 0.5rem;
    padding: 1rem;

    > * {
        text-decoration: none;
    }
`;

const DesktopRightPart = styled.div`
    display: flex;
`;

const ButtonStyled = styled(Button)`
    display: flex;
    gap: 6px;

    > svg {
        color: ${p => p.theme.buttonTertiaryForeground};
    }
`;

const DesktopAccountHeaderPayload = () => {
    usePreFetchRates();
    const { data: balance, isLoading } = useAccountTotalBalance();
    const { t } = useTranslation();
    const account = useActiveAccount();

    const { onOpen: manageMAMIndexes } = useMAMIndexesSettingsNotification();
    const network = useActiveTonNetwork();

    return (
        <DesktopHeaderContainer>
            <DesktopHeaderBalance isLoading={isLoading} balance={balance} network={network} />
            <DesktopRightPart>
                <ButtonsContainer>
                    <ButtonStyled
                        size="small"
                        onClick={() => manageMAMIndexes({ accountId: account.id })}
                    >
                        <PlusIconSmall />
                        {t('add_wallet')}
                    </ButtonStyled>
                </ButtonsContainer>
            </DesktopRightPart>
        </DesktopHeaderContainer>
    );
};

export const DesktopAccountHeader = () => {
    return (
        <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display desktop header')}>
            <DesktopAccountHeaderPayload />
        </ErrorBoundary>
    );
};
