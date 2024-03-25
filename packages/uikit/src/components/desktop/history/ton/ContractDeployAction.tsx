import React, { FC } from 'react';
import { Action } from '@tonkeeper/core/dist/tonApiV2';
import { useTranslation } from '../../../../hooks/translation';
import {
    ActionRow,
    ErrorRow,
    HistoryCellAccount,
    HistoryCellActionGeneric,
    HistoryCellAmountText,
    HistoryCellCommentSecondary
} from './HistoryCell';
import { DoneIcon } from '../../../Icon';
import { NftCollectionDeployDesktopAction, NftDeployDesktopAction } from './NftDesktopActions';
import { ContractDeployIcon } from '../../../activity/ActivityIcons';
import styled from 'styled-components';

const ContractDeployIconStyled = styled(ContractDeployIcon)`
    color: ${p => p.theme.iconPrimary};
    width: 16px;
    height: 16px;
`;

const DoneIconStyled = styled(DoneIcon)`
    color: ${p => p.theme.iconPrimary};
`;

export const ContractDeployDesktopAction: FC<{ action: Action }> = ({ action }) => {
    const { t } = useTranslation();
    const { contractDeploy } = action;

    if (!contractDeploy) {
        return <ErrorRow />;
    }

    const isFailed = action.status === 'failed';

    const interfaces = contractDeploy.interfaces ?? [];

    if (interfaces.includes('nft_item')) {
        return <NftDeployDesktopAction isFailed={isFailed} address={contractDeploy.address} />;
    }

    if (interfaces.includes('nft_collection')) {
        return (
            <NftCollectionDeployDesktopAction
                isFailed={isFailed}
                address={contractDeploy.address}
            />
        );
    }

    const walletType = interfaces.find(i => i.startsWith('wallet'));
    if (walletType) {
        return (
            <>
                <HistoryCellActionGeneric icon={<DoneIconStyled />} isFailed={isFailed}>
                    {t('transaction_type_wallet_initialized')}
                </HistoryCellActionGeneric>
                <HistoryCellAccount account={{ address: contractDeploy.address }} />
                <ActionRow>
                    <HistoryCellCommentSecondary comment={walletType} />
                    <HistoryCellAmountText>-</HistoryCellAmountText>
                </ActionRow>
            </>
        );
    }

    return (
        <>
            <HistoryCellActionGeneric icon={<ContractDeployIconStyled />} isFailed={isFailed}>
                {t('transaction_type_contract_deploy')}
            </HistoryCellActionGeneric>
            <HistoryCellAccount account={{ address: contractDeploy.address }} />
            <ActionRow>
                <HistoryCellCommentSecondary
                    comment={
                        contractDeploy.interfaces.length
                            ? 'Interfaces: [' + contractDeploy.interfaces.join(', ') + ']'
                            : ''
                    }
                />
                <HistoryCellAmountText>-</HistoryCellAmountText>
            </ActionRow>
        </>
    );
};
