import React, { FC } from 'react';
import { styled } from 'styled-components';
import { BorderSmallResponsive } from '../../shared/Styles';
import { Body2 } from '../../Text';
import { MultisigOrderStatus } from '@tonkeeper/core/dist/service/multisig/multisigService';
import { toTimeLeft } from '@tonkeeper/core/dist/utils/date';
import { useTranslation } from '../../../hooks/translation';

const MultisigDetailsBlock = styled.div`
    ${BorderSmallResponsive};
    background: ${p => p.theme.backgroundContent};
    padding: 8px 12px;
    margin-bottom: 16px;
`;

const MultisigDetailsRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;

    > *:first-child {
        color: ${p => p.theme.textSecondary};
    }
`;

export const MultisigTransferDetails: FC<{
    status: MultisigOrderStatus;
    signed: number;
    total: number;
    secondsLeft: number;
}> = ({ status, secondsLeft, signed, total }) => {
    const { t } = useTranslation();

    return (
        <MultisigDetailsBlock>
            <MultisigDetailsRow>
                <Body2>{t('multisig_status_label')}</Body2>
                <Body2>{t('multisig_status_' + status)}</Body2>
            </MultisigDetailsRow>
            <MultisigDetailsRow>
                <Body2>{t('multisig_signed_label')}</Body2>
                <Body2>
                    {t('multisig_signed_value')
                        .replace('{signed}', signed.toString())
                        .replace('{total}', total.toString())}
                </Body2>
            </MultisigDetailsRow>
            <MultisigDetailsRow>
                <Body2>{t('multisig_time_left')}</Body2>
                <Body2>{toTimeLeft(secondsLeft, { days: false })}</Body2>
            </MultisigDetailsRow>
        </MultisigDetailsBlock>
    );
};
