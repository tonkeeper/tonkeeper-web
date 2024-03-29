import styled, { css } from 'styled-components';

export const PromotedItem = styled.div`
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    height: 76px;
    display: flex;
    align-items: center;
    width: 100%;
`;

export const PromotedItemImage = styled.img`
    height: 44px;
    width: 44px;
    border-radius: ${props => props.theme.cornerExtraSmall};

    ${props =>
        props.theme.displayType === 'full-width' &&
        css`
            border-radius: 10px;
        `};
`;

export const PromotedItemText = styled.div<{ color?: string }>`
    display: flex;
    min-width: 0;
    flex-direction: column;
    padding: 11px 12px 13px;
    color: ${props => props.color || props.theme.textPrimary};

    & > span:nth-child(2) {
        opacity: 0.78;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        max-height: 32px;
`;
