import { FC } from 'react';
import { MultisigConfig } from '@tonkeeper/core/dist/service/multisig/deploy';
import { styled } from 'styled-components';
import { Body2 } from '../Text';
import { useAppSdk } from '../../hooks/appSdk';
import { useAppContext } from '../../hooks/appContext';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { useTranslation } from '../../hooks/translation';

const DiffContainer = styled.div``;

const DiffRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const DiffRowRed = styled(DiffRow)`
    color: ${p => p.theme.accentRed};
`;

const Body2Link = styled(Body2)`
    cursor: pointer;
`;

export const MultisigConfigDiff: FC<{
    prevConfig: Omit<MultisigConfig, 'allowArbitrarySeqno'>;
    newConfig: Omit<MultisigConfig, 'allowArbitrarySeqno'>;
    className?: string;
}> = ({ prevConfig, newConfig, className }) => {
    const { t } = useTranslation();
    const signersToAdd = newConfig.signers.filter(s => prevConfig.signers.every(v => !v.equals(s)));
    const signersToRemove = prevConfig.signers.filter(s =>
        newConfig.signers.every(v => !v.equals(s))
    );

    const sdk = useAppSdk();
    const { config } = useAppContext();

    const onOpenTonviewer = (address: string) => {
        const explorerUrl = config.accountExplorer ?? 'https://tonviewer.com/%s';

        sdk.openPage(explorerUrl.replace('%s', formatAddress(address)));
    };

    return (
        <DiffContainer className={className}>
            {prevConfig.threshold !== newConfig.threshold && (
                <DiffRow>
                    <Body2>{t('multisig_config_diff_quorum_updates')}</Body2>
                    <Body2>
                        {prevConfig.threshold} → {newConfig.threshold} participants
                    </Body2>
                </DiffRow>
            )}
            {signersToAdd.map(s => (
                <DiffRow key={s.toRawString()}>
                    <Body2>{t('multisig_config_diff_add_participant')}</Body2>
                    <Body2Link onClick={() => onOpenTonviewer(s.toString())}>
                        {toShortValue(formatAddress(s))}
                    </Body2Link>
                </DiffRow>
            ))}
            {signersToRemove.map(s => (
                <DiffRowRed key={s.toRawString()}>
                    <Body2>{t('multisig_config_diff_remove_participant')}</Body2>
                    <Body2Link onClick={() => onOpenTonviewer(s.toString())}>
                        {toShortValue(formatAddress(s))}
                    </Body2Link>
                </DiffRowRed>
            ))}
        </DiffContainer>
    );
};
