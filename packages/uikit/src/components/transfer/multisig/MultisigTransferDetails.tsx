import React, { FC } from 'react';
import { styled } from 'styled-components';
import { Body2, Mono } from '../../Text';
import { toTimeLeft } from '@tonkeeper/core/dist/utils/date';
import { useTranslation } from '../../../hooks/translation';
import { useAppSdk } from '../../../hooks/appSdk';
import { useAppContext } from '../../../hooks/appContext';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { MultisigOrderStatus } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/multisig-encoder';
import { useActiveConfig } from '../../../state/wallet';

const MultisigDetailsBlock = styled.div`
    width: 100%;
    box-sizing: border-box;
    padding: 8px 12px;
`;

const MultisigDetailsRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;

    > *:first-child {
        color: ${p => p.theme.textSecondary};
    }
`;

const Link = styled(Body2)`
    color: ${p => p.theme.accentBlue};
    cursor: pointer;
`;

export const MultisigTransferDetails: FC<{
    status: MultisigOrderStatus;
    signedWallets: string[];
    pendingWallets: string[];
    threshold: number;
    secondsLeft: number;
    orderAddress?: string;
    hostAddress: string;
}> = ({
    status,
    secondsLeft,
    signedWallets,
    pendingWallets,
    threshold,
    orderAddress,
    hostAddress
}) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const config = useActiveConfig();

    const onOpenTonviewer = (address: string) => {
        const explorerUrl = config.accountExplorer ?? 'https://tonviewer.com/%s';

        sdk.openPage(explorerUrl.replace('%s', formatAddress(address)));
    };

    return (
        <MultisigDetailsBlock>
            <MultisigDetailsRow>
                <Body2>{t('multisig_status_label')}</Body2>
                <Body2>{t('multisig_status_' + status)}</Body2>
            </MultisigDetailsRow>
            <MultisigDetailsRow>
                <Body2>{t('multisig_signed_label')}</Body2>
                <Body2>
                    {t('multisig_signed_value', { signed: signedWallets.length, total: threshold })}
                </Body2>
            </MultisigDetailsRow>
            {secondsLeft > 0 && status === 'progress' && (
                <MultisigDetailsRow>
                    <Body2>{t('multisig_time_left')}</Body2>
                    <Mono>
                        <Body2>{toTimeLeft(secondsLeft * 1000)}</Body2>
                    </Mono>
                </MultisigDetailsRow>
            )}
            {signedWallets.map((w, index) => (
                <MultisigDetailsRow key={w}>
                    {index === 0 ? (
                        <Body2>{t('multisig_order_details_signed_wallets')}</Body2>
                    ) : (
                        <div />
                    )}
                    <SignerAddress
                        highlighted={w === hostAddress}
                        onClick={() => onOpenTonviewer(w)}
                    >
                        {w === hostAddress && t('multisig_participant_you') + ' '}
                        <Mono>{toShortValue(formatAddress(w))}</Mono>
                    </SignerAddress>
                </MultisigDetailsRow>
            ))}
            {pendingWallets.map((w, index) => (
                <MultisigDetailsRow key={w}>
                    {index === 0 ? (
                        <Body2>{t('multisig_order_details_pending_signatures')}</Body2>
                    ) : (
                        <div />
                    )}
                    <SignerAddress
                        highlighted={w === hostAddress}
                        onClick={() => onOpenTonviewer(w)}
                    >
                        {w === hostAddress && t('multisig_participant_you') + ' '}
                        <Mono>{toShortValue(formatAddress(w))}</Mono>
                    </SignerAddress>
                </MultisigDetailsRow>
            ))}
            {!!orderAddress && (
                <MultisigDetailsRow>
                    <Body2>{t('multisig_order_details_explore')}</Body2>
                    <Link onClick={() => onOpenTonviewer(orderAddress)}>
                        {t('view_on_tonviewer')}
                    </Link>
                </MultisigDetailsRow>
            )}
        </MultisigDetailsBlock>
    );
};

const SignerAddress = styled(Body2)<{ highlighted?: boolean }>`
    color: ${p => (p.highlighted ? p.theme.textPrimary : p.theme.textSecondary)};
    cursor: pointer;
`;
