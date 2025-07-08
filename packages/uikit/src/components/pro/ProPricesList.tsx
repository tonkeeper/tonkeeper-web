import { FC } from 'react';
import styled from 'styled-components';
import { IDisplayPlan } from '@tonkeeper/core/dist/entries/pro';

import { Body2, Body3, Label2 } from '../Text';
import { SkeletonText } from '../shared/Skeleton';
import { getSkeletonProducts } from '../../libs/pro';
import { useTranslation } from '../../hooks/translation';
import { normalizeTranslationKey } from '../../libs/common';
import { ListBlock, ListItem, ListItemPayload } from '../List';

interface IProps {
    className?: string;
    removeTitle?: boolean;
    skeletonSize?: number;
    displayPlans?: IDisplayPlan[];
}

const ProPricesListContent: FC<IProps> = props => {
    const { className, removeTitle = false, displayPlans, skeletonSize } = props;
    const { t } = useTranslation();

    const productsForRender = displayPlans?.length
        ? displayPlans
        : getSkeletonProducts(skeletonSize);

    return (
        <div className={className}>
            {!removeTitle && <Title>{t('prices')}</Title>}
            <ListBlock fullWidth margin={false}>
                {productsForRender.map(planProps => {
                    const { id, displayName, formattedDisplayPrice } = planProps;

                    const titleNode = displayName ? (
                        <Body2Styled>{t(normalizeTranslationKey(displayName))}</Body2Styled>
                    ) : (
                        <SkeletonTextStyled width="100px" />
                    );

                    const priceNode = formattedDisplayPrice ? (
                        <Label2>{formattedDisplayPrice}</Label2>
                    ) : (
                        <SkeletonTextStyled width="100px" />
                    );

                    return (
                        <ListItemStyled hover={false} key={id}>
                            <ListItemPayloadStyled>
                                {titleNode}
                                {priceNode}
                            </ListItemPayloadStyled>
                        </ListItemStyled>
                    );
                })}
            </ListBlock>
        </div>
    );
};

export const ProPricesList = styled(ProPricesListContent)`
    width: 100%;
`;

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

const ListItemStyled = styled(ListItem)`
    &:not(:first-child) > div {
        padding-top: 10px;
    }
`;

const ListItemPayloadStyled = styled(ListItemPayload)`
    padding-top: 10px;
    padding-bottom: 10px;
`;

const SkeletonTextStyled = styled(SkeletonText)`
    height: 20px;
`;
