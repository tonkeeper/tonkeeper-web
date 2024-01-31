import { PromotedItem, PromotedItemText } from '../../pages/browser/PromotedItem';
import { Skeleton } from '../shared/Skeleton';
import React, { FC } from 'react';
import { ListBlock, ListItem } from '../List';
import styled from 'styled-components';

const ListItemStyled = styled(ListItem)`
    padding-left: 1rem;
`;

const Heading = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 0;
    gap: 1rem;
`;

const CarouselSkeleton = styled(Skeleton)`
    height: auto;
    aspect-ratio: 2 / 1;
`;

export const RecommendationsPageBodySkeleton: FC = () => {
    return (
        <>
            <CarouselSkeleton width="100%" borderRadius="cornerSmall" margin="0 auto 1rem" />
            <CategorySkeleton />
            <CategorySkeleton />
        </>
    );
};

export const RecommendationPageListItemSkeleton = () => {
    return (
        <ListItemStyled hover={false}>
            <PromotedItem>
                <Skeleton width="44px" height="44px" />
                <PromotedItemText>
                    <Skeleton height="14px" width="140px" margin="3px 0 5px 0" />
                    <Skeleton height="12px" width="260px" marginBottom="2px" />
                </PromotedItemText>
            </PromotedItem>
        </ListItemStyled>
    );
};

const CategorySkeleton: FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={className}>
            <Heading>
                <Skeleton height="20px" margin="4px 0" width="200px" />
            </Heading>
            <ListBlock>
                <RecommendationPageListItemSkeleton />
                <RecommendationPageListItemSkeleton />
                <RecommendationPageListItemSkeleton />
            </ListBlock>
        </div>
    );
};
