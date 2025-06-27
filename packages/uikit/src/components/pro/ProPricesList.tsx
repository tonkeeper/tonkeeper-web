import { FC } from 'react';
import styled from 'styled-components';
import { ProductIds } from '@tonkeeper/core/dist/entries/pro';

import { Body2, Body3, Label2 } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { ListBlock, ListItem, ListItemPayload } from '../List';

const Text = styled(Body3)`
    display: block;
    color: ${p => p.theme.textSecondary};
`;

const Title = styled(Text)`
    margin: 8px 0;
`;

const Body2Styled = styled(Body2)`
    display: block;
    color: ${p => p.theme.textSecondary};
`;

const ListItemPayloadStyled = styled(ListItemPayload)`
    padding-top: 10px;
    padding-bottom: 10px;
`;

interface IProProduct {
    id: ProductIds;
    titleKey: string;
    price: string;
}

const IOS_PRODUCTS: IProProduct[] = [
    {
        id: ProductIds.MONTHLY,
        titleKey: 'one_month',
        price: '$2.99'
    },
    {
        id: ProductIds.YEARLY,
        titleKey: 'one_year',
        price: '$24.99'
    }
];

interface IProps {
    className?: string;
    removeTitle?: boolean;
    products?: IProProduct[];
}

const ProPricesListContent: FC<IProps> = props => {
    const { className, removeTitle = false, products = IOS_PRODUCTS } = props;
    const { t } = useTranslation();

    return (
        <div className={className}>
            {!removeTitle && <Title>{t('prices')}</Title>}
            <ListBlock fullWidth margin={false}>
                {products.map(({ id, titleKey, price }) => (
                    <ListItem key={id}>
                        <ListItemPayloadStyled>
                            <Body2Styled>{t(titleKey)}</Body2Styled>
                            <Label2>{price}</Label2>
                        </ListItemPayloadStyled>
                    </ListItem>
                ))}
            </ListBlock>
        </div>
    );
};

export const ProPricesList = styled(ProPricesListContent)`
    width: 100%;
`;
