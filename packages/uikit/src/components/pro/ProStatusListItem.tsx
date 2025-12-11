import { FC } from 'react';
import styled from 'styled-components';
import {
    isExtensionCancellingSubscription,
    isPendingSubscription,
    ProSubscription
} from '@tonkeeper/core/dist/entries/pro';
import { getStatusColor, getStatusText } from '@tonkeeper/core/dist/utils/pro';

import { useSupport } from '../../state/pro';
import { useAppSdk } from '../../hooks/appSdk';
import { Body2, Body3, Body3Class } from '../Text';
import { ListItem, ListItemPayload } from '../List';
import { useToast } from '../../hooks/useNotification';
import { useTranslation } from '../../hooks/translation';

interface Props {
    statusText?: string;
    subscription: ProSubscription;
}
export const ProStatusListItem: FC<Props> = ({ statusText, subscription }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { data: support } = useSupport();
    const toast = useToast();
    const isSupportVisible =
        isPendingSubscription(subscription) || isExtensionCancellingSubscription(subscription);

    const handleSupportClick = () => {
        if (!support.url) {
            toast('error_occurred');

            return;
        }

        void sdk.openPage(support.url);
    };

    return (
        <ListItemStyled hover={false}>
            <ListItemPayloadStyled>
                <LineWrapper>
                    <Body2RegularStyled>{t('status')}</Body2RegularStyled>
                    <Body2Styled color={getStatusColor(subscription)}>
                        {statusText ?? getStatusText(subscription, t)}
                    </Body2Styled>
                </LineWrapper>

                {isSupportVisible && (
                    <ActionWrapper>
                        <Body3Styled>{t('taking_too_long')} </Body3Styled>
                        <ButtonStyled type="button" onClick={handleSupportClick}>
                            {t('contact_support')}
                        </ButtonStyled>
                    </ActionWrapper>
                )}
            </ListItemPayloadStyled>
        </ListItemStyled>
    );
};

const LineWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    width: 100%;
`;

const ActionWrapper = styled.div`
    margin-right: auto;
`;

const ButtonStyled = styled.button`
    ${Body3Class};

    height: 20px;
    margin-right: auto;
    color: ${props => props.theme.textAccent};
    opacity: 1;
    transition: opacity 0.3s;

    &:hover {
        opacity: 0.7;
    }
`;

const Body2Styled = styled(Body2)<{
    color?: 'accentOrange' | 'textSecondary';
}>`
    color: ${({ theme, color }) => (color ? theme[color] : theme.textPrimary)};
`;

const Body3Styled = styled(Body3)`
    color: ${({ theme }) => theme.textSecondary};
`;

const Body2RegularStyled = styled(Body2Styled)`
    color: ${({ theme }) => theme.textSecondary};
    font-weight: 400;
    text-transform: capitalize;
`;

const ListItemStyled = styled(ListItem)`
    &:not(:first-child) > div {
        padding-top: 10px;
    }
`;

const ListItemPayloadStyled = styled(ListItemPayload)`
    flex-direction: column;
    gap: 0;

    padding-top: 10px;
    padding-bottom: 10px;
`;
