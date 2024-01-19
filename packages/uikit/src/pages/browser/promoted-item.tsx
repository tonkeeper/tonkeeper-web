import styled from 'styled-components';

export const PromotedItem = styled.div`
    padding-top: 8px !important;
    padding-bottom: 8px !important;
    display: flex;
    align-items: center;
    width: 100%;
`;

export const PromotedItemImage = styled.img`
    height: 44px;
    width: 44px;
    border-radius: ${props => props.theme.cornerExtraSmall};
`;

export const PromotedItemText = styled.div<{ color?: string }>`
    display: flex;
    flex-direction: column;
    padding: 11px 12px 13px;
    word-break: break-word;
    color: ${props => props.color || props.theme.textPrimary};

    & > span:nth-child(2) {
        opacity: 0.78;
    }
`;
