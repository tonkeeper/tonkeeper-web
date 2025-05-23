import { useTranslation } from '../../hooks/translation';
import { fallbackRenderOver } from '../../components/Error';
import { AppRoute } from '../../libs/routes';

import {
    useCanUseTronForActiveWallet,
    useIsTronEnabledForActiveWallet,
    useToggleIsTronEnabledForActiveWallet
} from '../../state/tron/tron';
import { SubHeader } from '../../components/SubHeader';
import { InnerBody } from '../../components/Body';
import { AssetBlockchainBadge } from '../../components/account/AccountBadge';
import { Body3, Label1 } from '../../components/Text';
import React from 'react';
import { ListBlock, ListItem, ListItemPayload } from '../../components/List';
import { Switch } from '../../components/fields/Switch';
import styled from 'styled-components';
import { Navigate } from '../../components/shared/Navigate';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';

const LabelWithBadge = styled(Label1)`
    display: flex;
    align-items: center;
    gap: 6px;
`;

const SwitchStyled = styled(Switch)`
    flex-shrink: 0;
`;

const Body3Styled = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

export const ChainsPage = () => {
    const canUseTron = useCanUseTronForActiveWallet();
    const { t } = useTranslation();
    const isTronEnabled = useIsTronEnabledForActiveWallet();
    const { mutate: onToggleTron } = useToggleIsTronEnabledForActiveWallet();

    if (!canUseTron) {
        return <Navigate to={AppRoute.home} />;
    }

    return (
        <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display chains')}>
            <SubHeader title={t('chains_title')} />
            <InnerBody>
                <ListBlock>
                    <ListItem hover={false} onClick={() => onToggleTron()}>
                        <ListItemPayload>
                            <div>
                                <LabelWithBadge>
                                    USD₮<AssetBlockchainBadge>TRC20</AssetBlockchainBadge>
                                </LabelWithBadge>
                                <Body3Styled>{t('settings_enable_tron_description')}</Body3Styled>
                            </div>
                            <SwitchStyled checked={isTronEnabled} />
                        </ListItemPayload>
                    </ListItem>
                </ListBlock>
            </InnerBody>
        </ErrorBoundary>
    );
};
