import { Action } from '@tonkeeper/core/dist/tonApiV2';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import { useTranslation } from '../../../hooks/translation';
import { ListBlock } from '../../List';
import { ContractDeployActivityAction, WalletDeployActivityAction } from '../ActivityActionLayout';
import { FailedDetail } from '../ActivityDetailsLayout';
import { ActivityIcon, ContractDeployIcon } from '../ActivityIcons';
import { ColumnLayout, ErrorAction, ListItemGrid } from '../CommonAction';
import {
    ActionDate,
    ActionDeployerDetails,
    ActionDetailsBlock,
    ActionExtraDetails,
    ActionTransactionDetails,
    ErrorActivityNotification,
    Title
} from '../NotificationCommon';
import { ActionData } from './ActivityNotification';
import { NftComment } from './NftActivity';
import { useActiveTonNetwork } from '../../../state/wallet';

export const ContractDeployActionDetails: FC<ActionData> = ({ action, timestamp, event }) => {
    const { t } = useTranslation();
    const { contractDeploy } = action;

    if (!contractDeploy) {
        return <ErrorActivityNotification event={event} />;
    }

    return (
        <ActionDetailsBlock event={event}>
            <div>
                <Title>
                    {contractDeploy.interfaces?.includes('wallet')
                        ? t('transaction_type_wallet_initialized')
                        : t('transaction_type_contract_deploy')}
                </Title>
                <ActionDate kind="received" timestamp={timestamp} />
                <FailedDetail status={action.status} />
            </div>
            <ListBlock margin={false} fullWidth>
                <ActionDeployerDetails deployer={contractDeploy.address} />
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const ContractDeployAction: FC<{
    action: Action;
    date: string;
}> = ({ action, date }) => {
    const { t } = useTranslation();
    const { contractDeploy } = action;
    const network = useActiveTonNetwork();
    if (!contractDeploy) {
        return <ErrorAction />;
    }
    const interfaces = contractDeploy.interfaces ?? [];
    const address = toShortValue(
        formatAddress(
            contractDeploy.address,
            network,
            !interfaces.some(value => value.includes('wallet'))
        )
    );

    if (interfaces.includes('nft_item')) {
        return (
            <ListItemGrid>
                <ActivityIcon status={action.status}>
                    <ContractDeployIcon />
                </ActivityIcon>
                <ColumnLayout title={t('NFT_creation')} entry="-" address={address} date={date} />
                <NftComment address={contractDeploy.address} />
            </ListItemGrid>
        );
    }
    if (interfaces.includes('nft_collection')) {
        return (
            <ListItemGrid>
                <ActivityIcon status={action.status}>
                    <ContractDeployIcon />
                </ActivityIcon>
                <ColumnLayout
                    title={t('nft_deploy_collection_title')}
                    entry="-"
                    address={address}
                    date={date}
                />
            </ListItemGrid>
        );
    }
    if (interfaces.includes('wallet')) {
        return <WalletDeployActivityAction address={address} date={date} />;
    }

    return <ContractDeployActivityAction address={address} date={date} />;
};
