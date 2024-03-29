import styled from 'styled-components';
import { FC } from 'react';
import { PromotedApp } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { useAppContext } from '../../hooks/appContext';
import { useOpenLinkOnAreaClick } from '../../hooks/useAreaClick';
import { Body3, Label2 } from '../../components/Text';

export const DesktopPromotedItem = styled.div`
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    height: 56px;
    display: flex;
    align-items: center;
    width: 100%;
    cursor: pointer;
    border-radius: ${p => p.theme.corner2xSmall};
    transition: background-color 0.15s ease-in-out;

    &:hover {
        background-color: ${props => props.theme.backgroundContent};
    }
`;

export const DesktopPromotedItemImage = styled.img`
    height: 40px;
    width: 40px;
    border-radius: 10px;
    margin-left: 0.5rem;
`;

export const DesktopPromotedItemText = styled.div<{ color?: string }>`
    max-width: calc(100% - 48px);
    display: flex;
    flex-direction: column;
    padding: 10px 12px;
    box-sizing: border-box;
    color: ${props => props.color || props.theme.textPrimary};

  
    & > span:nth-child(1) {
      overflow: hidden;
      text-overflow: ellipsis;
      max-height: 20px;
      white-space: nowrap;
    }
    & > span:nth-child(2) {
        color: ${props => props.color || props.theme.textSecondary};
        overflow: hidden;
        text-overflow: ellipsis;
        max-height: 16px;
      white-space: nowrap;
`;

export const DesktopCategoryGroupItem: FC<{ item: PromotedApp; className?: string }> = ({
    item,
    className
}) => {
    const { tonendpoint } = useAppContext();
    const ref = useOpenLinkOnAreaClick(item.url, 'recommendation', tonendpoint.getTrack());

    return (
        <DesktopPromotedItem ref={ref} className={className}>
            <DesktopPromotedItemImage src={item.icon} />
            <DesktopPromotedItemText>
                <Label2>{item.name}</Label2>
                <Body3>{item.description}</Body3>
            </DesktopPromotedItemText>
        </DesktopPromotedItem>
    );
};
