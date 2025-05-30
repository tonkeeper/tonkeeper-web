import styled from 'styled-components';
import { useTranslation } from '../../../hooks/translation';
import { fallbackRenderOver } from '../../Error';
import { ExportIcon, SlidersIcon } from '../../Icon';
import { Button } from '../../fields/Button';
import { useAllWalletsTotalBalance } from '../../../state/asset';
import { DesktopHeaderBalance, DesktopHeaderContainer } from './DesktopHeaderElements';
import { CategoriesModal } from '../../dashboard/CategoriesModal';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { useDashboardData } from '../../../state/dashboard/useDashboardData';
import { arrayToCsvString } from '@tonkeeper/core/dist/service/parserService';
import { toStringDashboardCell } from '@tonkeeper/core/dist/entries/dashboard';
import { useMemo } from 'react';
import {
    useDashboardColumns,
    useDashboardColumnsForm
} from '../../../state/dashboard/useDashboardColumns';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { DesktopViewHeader, DesktopViewHeaderContent } from '../DesktopViewLayout';
import { useUserFiat } from '../../../state/fiat';
import { formatFiatCurrency } from '../../../hooks/balance';
import { useAppTargetEnv } from '../../../hooks/appSdk';
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

const DesktopDashboardHeaderPayload = () => {
    const { data: balance, isLoading } = useAllWalletsTotalBalance(Network.MAINNET);
    const { t } = useTranslation();
    const { isOpen, onClose, onOpen } = useDisclosure();
    const { data } = useDashboardData();
    const { data: columns } = useDashboardColumns();
    const [{ data: selectedColumns }] = useDashboardColumnsForm();

    const downloadContent = useMemo(() => {
        if (!data || !columns || !selectedColumns) {
            return undefined;
        }

        const columnsRow = selectedColumns
            .filter(c => c.isEnabled)
            .map(c => columns.find(item => item.id === c.id)?.name || c.id);
        const dataRows: string[][] = data.map(row => row.cells.map(toStringDashboardCell));
        return arrayToCsvString([columnsRow, ...dataRows]);
    }, [data, columns, selectedColumns]);

    const platform = useAppTargetEnv();

    return (
        <DesktopHeaderContainer>
            <DesktopHeaderBalance
                isLoading={isLoading}
                balance={balance}
                network={Network.MAINNET}
            />
            <DesktopRightPart>
                <ButtonsContainer>
                    {platform !== 'tablet' && (
                        <Button
                            size="small"
                            as="a"
                            href={encodeURI('data:text/csv;charset=utf-8,' + downloadContent || '')}
                            download={'tonkeeper-wallets' + '.csv'}
                            loading={!downloadContent}
                        >
                            <ExportIcon />
                            {t('export_dot_csv')}
                        </Button>
                    )}
                    <Button size="small" onClick={onOpen}>
                        <SlidersIcon />
                        {t('Manage')}
                    </Button>
                </ButtonsContainer>
            </DesktopRightPart>
            <CategoriesModal isOpen={isOpen} onClose={onClose} />
        </DesktopHeaderContainer>
    );
};

export const DPDashboardHeader = () => {
    return (
        <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display desktop header')}>
            <DesktopDashboardHeaderPayload />
        </ErrorBoundary>
    );
};

export const MPDashboardHeader = () => {
    return (
        <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display desktop header')}>
            <MPDashboardHeaderPayload />
        </ErrorBoundary>
    );
};

const MPDashboardHeaderPayload = () => {
    const { data: balance, isLoading } = useAllWalletsTotalBalance(Network.MAINNET);
    const { t } = useTranslation();
    const { isOpen, onClose, onOpen } = useDisclosure();
    const fiat = useUserFiat();

    return (
        <DesktopViewHeader>
            <DesktopViewHeaderContent
                right={
                    <DesktopViewHeaderContent.Right>
                        <DesktopViewHeaderContent.RightItem onClick={onOpen} closeDropDownOnClick>
                            <SlidersIcon />
                            {t('Manage')}
                        </DesktopViewHeaderContent.RightItem>
                    </DesktopViewHeaderContent.Right>
                }
                title={
                    !isLoading
                        ? formatFiatCurrency(fiat, balance || 0)
                        : t('dashboard_manage_modal_title')
                }
            ></DesktopViewHeaderContent>
            <CategoriesModal isOpen={isOpen} onClose={onClose} />
        </DesktopViewHeader>
    );
};
