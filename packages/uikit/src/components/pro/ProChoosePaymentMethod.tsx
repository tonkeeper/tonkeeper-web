import React, { FC } from 'react';
import styled from 'styled-components';

import { Body3, Label2 } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { DoneIcon } from '../Icon';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';

interface IProps {
    sources: ReadonlyArray<SubscriptionSource>;
    selectedSource: SubscriptionSource;
    onSourceSelect: (source: SubscriptionSource) => void;
    isLoading: boolean;
}

export const ProChoosePaymentMethod: FC<IProps> = props => {
    const { sources, selectedSource, onSourceSelect, isLoading } = props;

    const { t } = useTranslation();

    return (
        <SubscriptionPlansBlock>
            <Header>
                <Subtitle>{t('payment_method')}</Subtitle>
            </Header>

            <ListBlock fullWidth margin={false}>
                {sources.map(source => (
                    <ListItemStyled
                        key={source}
                        onClick={() => onSourceSelect(source)}
                        hover={!isLoading}
                    >
                        <ListItemPayloadStyled>
                            <Label2>
                                {t(source === SubscriptionSource.IOS ? 'app_store' : 'crypto')}
                            </Label2>
                            {source === selectedSource && <Icon>{<DoneIcon />}</Icon>}
                        </ListItemPayloadStyled>
                    </ListItemStyled>
                ))}
            </ListBlock>
        </SubscriptionPlansBlock>
    );
};

const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
`;

const Icon = styled.span`
    padding-left: 0.5rem;
    color: ${props => props.theme.accentBlue};
    display: flex;
    margin-left: auto;
    height: 16px;
    width: 24px;
`;

const ListItemStyled = styled(ListItem)`
    &:not(:first-child) > div {
        padding-top: 10px;
    }
`;

const ListItemPayloadStyled = styled(ListItemPayload)`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 10px;
    padding-bottom: 10px;
`;

const SubscriptionPlansBlock = styled.div`
    width: 100%;
`;

const Subtitle = styled(Body3)`
    max-width: 576px;
    display: block;
    color: ${p => p.theme.textSecondary};
    text-align: left;
`;
