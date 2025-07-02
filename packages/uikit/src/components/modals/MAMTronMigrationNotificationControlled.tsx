import { Notification } from '../Notification';
import { createModalControl } from './createModalControl';
import React, { useCallback } from 'react';
import { useTranslation } from '../../hooks/translation';
import { useAtom } from '../../libs/useAtom';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import styled from 'styled-components';
import { Body2, H2Label2Responsive } from '../Text';
import { Button } from '../fields/Button';
import { ExternalLink } from '../shared/ExternalLink';
import { useAppContext } from '../../hooks/appContext';
import { toShortValue } from '@tonkeeper/core/dist/utils/common';

const { hook, paramsControl } = createModalControl<{
    address: string;
    usdtBalance: AssetAmount;
}>();

export const useMamTronMigrationNotification = hook;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    > *:first-child {
        margin-bottom: 4px;
        max-width: 304px;
    }

    ${Body2} {
        color: ${p => p.theme.textSecondary};
        max-width: 304px;
        text-wrap: balance;
        margin-bottom: 24px;
    }
`;

export const MAMTronMigrationNotification = () => {
    const { isOpen, onClose } = useMamTronMigrationNotification();
    const { t } = useTranslation();
    const [params] = useAtom(paramsControl);
    const { mainnetConfig } = useAppContext();

    const Content = useCallback(() => {
        if (!params?.address) {
            return null;
        }

        const explorerUrl = `https://tronscan.org/#/address/${params.address}`;

        return (
            <Wrapper>
                <H2Label2Responsive>{t('restore_mam_tron_wallet_title')}</H2Label2Responsive>
                <ExternalLink contents href={explorerUrl}>
                    <Body2>
                        {t('restore_mam_tron_wallet_description', {
                            amount: params.usdtBalance.stringRelativeAmount,
                            address: toShortValue(params.address)
                        })}
                    </Body2>
                </ExternalLink>
                <ExternalLink contents href={mainnetConfig.directSupportUrl!}>
                    <Button fullWidth secondary>
                        {t('restore_mam_tron_wallet_button')}
                    </Button>
                </ExternalLink>
            </Wrapper>
        );
    }, [onClose, params, t, mainnetConfig]);

    return (
        <Notification isOpen={isOpen} handleClose={onClose} mobileFullScreen>
            {Content}
        </Notification>
    );
};
