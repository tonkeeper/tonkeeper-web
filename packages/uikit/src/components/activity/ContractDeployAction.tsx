import { Action, NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import { ActivityIcon, ContractDeployIcon } from '../../components/activity/ActivityIcons';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useTonenpointStock } from '../../state/tonendpoint';
import { ListBlock } from '../List';
import { ContractDeployActivityAction, WalletDeployActivityAction } from './ActivityActionLayout';
import { ActionData } from './ActivityNotification';
import { ColumnLayout, ErrorAction, ListItemGrid } from './CommonAction';
import { NftComment } from './NftActivity';
import {
    ActionDate,
    ActionDeployerDetails,
    ActionDetailsBlock,
    ActionFeeDetails,
    ActionTransactionDetails,
    ErrorActivityNotification,
    Title
} from './NotificationCommon';

export const ContractDeployActionDetails: FC<ActionData> = ({ action, timestamp, event }) => {
    const { t } = useTranslation();
    const { contractDeploy } = action;
    const { fiat } = useAppContext();
    const { data: stock } = useTonenpointStock();

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
            </div>
            <ListBlock margin={false} fullWidth>
                <ActionDeployerDetails deployer={contractDeploy.deployer} />
                <ActionTransactionDetails event={event} />
                <ActionFeeDetails fee={event.fee} stock={stock} fiat={fiat} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const ContractDeployAction: FC<{
    action: Action;
    date: string;
    openNft: (nft: NftItemRepr) => void;
}> = ({ action, date, openNft }) => {
    const { t } = useTranslation();
    const { contractDeploy } = action;
    const wallet = useWalletContext();
    if (!contractDeploy) {
        return <ErrorAction />;
    }
    const interfaces = contractDeploy.interfaces ?? [];
    const address = toShortValue(formatAddress(contractDeploy.address, wallet.network));

    if (interfaces.includes('nft_item')) {
        return (
            <ListItemGrid>
                <ActivityIcon>
                    <ContractDeployIcon />
                </ActivityIcon>
                <ColumnLayout title={t('NFT_creation')} entry="-" address={address} date={date} />
                <NftComment address={contractDeploy.address} openNft={openNft} />
            </ListItemGrid>
        );
    }
    if (interfaces.includes('nft_collection')) {
        return (
            <ListItemGrid>
                <ActivityIcon>
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
