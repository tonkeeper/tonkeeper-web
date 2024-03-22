import React, { FC } from 'react';
import { Action } from '@tonkeeper/core/dist/tonApiV2';
import { useTranslation } from '../../../../hooks/translation';
import {
    ActionRow,
    ErrorRow,
    HistoryCellAccount,
    HistoryCellActionGeneric,
    HistoryCellCommentSecondary
} from './HistoryCell';
import { DoneIcon } from '../../../Icon';
import { NftCollectionDeployDesktopAction, NftDeployDesktopAction } from './NftDesktopAction';
import { ContractDeployIcon } from '../../../activity/ActivityIcons';
import styled from 'styled-components';
import { Body2 } from '../../../Text';

const ContractDeployIconStyled = styled(ContractDeployIcon)`
    color: ${p => p.theme.iconPrimary};
    width: 16px;
    height: 16px;
`;

const DoneIconStyled = styled(DoneIcon)`
    color: ${p => p.theme.iconPrimary};
`;

const AmountCellStub = styled(Body2)`
    color: ${p => p.theme.textTertiary};
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
            <ActionRow>
                <HistoryCellActionGeneric icon={<DoneIconStyled />} isFailed={isFailed}>
                    {t('transaction_type_wallet_initialized')}
                </HistoryCellActionGeneric>
                <HistoryCellAccount account={{ address: contractDeploy.address }} />
                <HistoryCellCommentSecondary comment={walletType} />
                <AmountCellStub>-</AmountCellStub>
            </ActionRow>
        );
    }

    return (
        <ActionRow>
            <HistoryCellActionGeneric icon={<ContractDeployIconStyled />} isFailed={isFailed}>
                {t('transaction_type_contract_deploy')}
            </HistoryCellActionGeneric>
            <HistoryCellAccount account={{ address: contractDeploy.address }} />
            <HistoryCellCommentSecondary
                comment={
                    contractDeploy.interfaces.length
                        ? 'Interfaces: [' + contractDeploy.interfaces.join(', ') + ']'
                        : ''
                }
            />
            <AmountCellStub>-</AmountCellStub>
        </ActionRow>
    );
};
